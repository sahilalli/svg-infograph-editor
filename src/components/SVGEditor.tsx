import React, { useState, useRef, useEffect } from 'react';
import { Canvas as FabricCanvas, FabricText, util } from 'fabric';
import { FileUpload } from './FileUpload';
import { TextElementEditor } from './TextElementEditor';
import { SchemaOutput } from './SchemaOutput';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, RefreshCw, Eye, Edit3 } from 'lucide-react';
import { toast } from 'sonner';

export interface TextElement {
  id: string;
  svgId: string;
  position: { x: number; y: number };
  font: {
    size: number;
    family: string;
    color: string;
  };
  text: string;
  fabricObject?: FabricText;
}

export const SVGEditor = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fabricCanvas, setFabricCanvas] = useState<FabricCanvas | null>(null);
  const [textElements, setTextElements] = useState<Record<string, TextElement>>({});
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [mode, setMode] = useState<'preview' | 'edit'>('preview');
  const [originalSVG, setOriginalSVG] = useState<string>('');
  // Map to track which Fabric object corresponds to which element ID
  const [objectToElementMap, setObjectToElementMap] = useState<Map<FabricText, string>>(new Map());

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = new FabricCanvas(canvasRef.current, {
      width: 800,
      height: 600,
      backgroundColor: '#ffffff',
      selection: mode === 'edit',
    });

    canvas.on('selection:created', (e) => {
      if (mode === 'edit' && e.selected?.[0]) {
        const obj = e.selected[0] as FabricText;
        const elementId = objectToElementMap.get(obj);
        if (elementId) {
          setSelectedElement(elementId);
        }
      }
    });

    canvas.on('selection:cleared', () => {
      setSelectedElement(null);
    });

    canvas.on('object:modified', (e) => {
      if (mode === 'edit') {
        updateElementFromFabricObject(e.target as FabricText);
      }
    });

    setFabricCanvas(canvas);

    return () => {
      canvas.dispose();
    };
  }, [mode, objectToElementMap]);

  const updateElementFromFabricObject = (obj: FabricText) => {
    const elementId = objectToElementMap.get(obj);
    if (!elementId) return;

    setTextElements(prev => ({
      ...prev,
      [elementId]: {
        ...prev[elementId],
        position: { x: obj.left || 0, y: obj.top || 0 },
        font: {
          ...prev[elementId].font,
          size: obj.fontSize || 16,
          family: obj.fontFamily || 'Arial',
          color: obj.fill as string || '#000000',
        },
        text: obj.text || '',
      }
    }));
  };

  const handleSVGUpload = async (file: File) => {
    try {
      const svgText = await file.text();
      setOriginalSVG(svgText);
      
      console.log('SVG Text:', svgText);
      
      // Parse SVG and extract text elements
      const parser = new DOMParser();
      const svgDoc = parser.parseFromString(svgText, 'image/svg+xml');
      const svgElement = svgDoc.querySelector('svg');
      const textElements = svgDoc.querySelectorAll('text');
      
      console.log('Found text elements:', textElements.length);
      
      const extractedElements: Record<string, TextElement> = {};
      const newObjectToElementMap = new Map<FabricText, string>();
      
      textElements.forEach((textEl, index) => {
        const id = textEl.id || `text-element-${index + 1}`;
        
        // Parse position attributes more carefully
        const xAttr = textEl.getAttribute('x') || textEl.getAttribute('dx') || '0';
        const yAttr = textEl.getAttribute('y') || textEl.getAttribute('dy') || '0';
        const x = parseFloat(xAttr);
        const y = parseFloat(yAttr);
        
        // Parse font attributes
        const fontSize = parseFloat(textEl.getAttribute('font-size') || textEl.style.fontSize || '16');
        const fontFamily = textEl.getAttribute('font-family') || textEl.style.fontFamily || 'Arial';
        const fill = textEl.getAttribute('fill') || textEl.style.fill || '#000000';
        const text = textEl.textContent || '';

        console.log(`Element ${id}:`, { x, y, fontSize, fontFamily, fill, text });

        // Create Fabric text object
        const fabricTextObj = new FabricText(text, {
          left: x,
          top: y,
          fontSize: fontSize,
          fontFamily: fontFamily,
          fill: fill,
          selectable: mode === 'edit',
        });

        extractedElements[id] = {
          id,
          svgId: id,
          position: { x, y },
          font: {
            size: fontSize,
            family: fontFamily,
            color: fill,
          },
          text,
          fabricObject: fabricTextObj,
        };

        // Map the fabric object to element ID
        newObjectToElementMap.set(fabricTextObj, id);
      });

      setTextElements(extractedElements);
      setObjectToElementMap(newObjectToElementMap);
      
      // Load SVG into canvas
      if (fabricCanvas) {
        fabricCanvas.clear();
        
        // First, load the entire SVG as background
        util.loadSVGFromString(svgText).then((result) => {
          const svgObjects = result.objects;
          svgObjects.forEach(obj => {
            obj.selectable = false; // Make background elements non-selectable
            obj.evented = false; // Disable events for background
            fabricCanvas.add(obj);
          });
          
          // Then add our editable text objects on top
          Object.values(extractedElements).forEach(element => {
            if (element.fabricObject) {
              fabricCanvas.add(element.fabricObject);
            }
          });
          
          fabricCanvas.renderAll();
          toast.success(`Extracted ${Object.keys(extractedElements).length} text elements`);
        }).catch(error => {
          console.error('Error loading SVG:', error);
          // Fallback: just add text elements
          Object.values(extractedElements).forEach(element => {
            if (element.fabricObject) {
              fabricCanvas.add(element.fabricObject);
            }
          });
          fabricCanvas.renderAll();
          toast.success(`Extracted ${Object.keys(extractedElements).length} text elements`);
        });
      }
    } catch (error) {
      toast.error('Failed to parse SVG file');
      console.error('SVG parsing error:', error);
    }
  };

  const regenerateSchema = () => {
    const schema: Record<string, any> = {};
    
    Object.values(textElements).forEach(element => {
      schema[element.id] = {
        svg_id: element.svgId,
        position: element.position,
        font: element.font,
        text: element.text, // Include text content in schema
      };
    });

    return schema;
  };

  const downloadSchema = () => {
    const schema = regenerateSchema();
    const blob = new Blob([JSON.stringify(schema, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'schema.json';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Schema downloaded successfully!');
  };

  const updateTextElement = (id: string, updates: Partial<TextElement>) => {
    setTextElements(prev => ({
      ...prev,
      [id]: { ...prev[id], ...updates }
    }));

    // Update fabric object if it exists
    const element = textElements[id];
    if (element?.fabricObject) {
      const obj = element.fabricObject;
      if (updates.position) {
        obj.set({ left: updates.position.x, top: updates.position.y });
      }
      if (updates.font) {
        obj.set({
          fontSize: updates.font.size,
          fontFamily: updates.font.family,
          fill: updates.font.color,
        });
      }
      if (updates.text !== undefined) {
        obj.set({ text: updates.text });
      }
      fabricCanvas?.renderAll();
    }
  };

  const removeTextElement = (id: string) => {
    const element = textElements[id];
    if (element?.fabricObject && fabricCanvas) {
      fabricCanvas.remove(element.fabricObject);
      // Remove from the map as well
      setObjectToElementMap(prev => {
        const newMap = new Map(prev);
        newMap.delete(element.fabricObject!);
        return newMap;
      });
    }
    
    setTextElements(prev => {
      const newElements = { ...prev };
      delete newElements[id];
      return newElements;
    });
    
    if (selectedElement === id) {
      setSelectedElement(null);
    }
    
    toast.success('Text element removed');
  };

  const renameTextElement = (oldId: string, newId: string) => {
    if (textElements[newId]) {
      toast.error('Element with this ID already exists');
      return;
    }

    const element = textElements[oldId];
    if (element?.fabricObject) {
      // Update the map with new ID
      setObjectToElementMap(prev => {
        const newMap = new Map(prev);
        newMap.delete(element.fabricObject!);
        newMap.set(element.fabricObject!, newId);
        return newMap;
      });
    }

    setTextElements(prev => {
      const newElements = { ...prev };
      newElements[newId] = { ...newElements[oldId], id: newId, svgId: newId };
      delete newElements[oldId];
      return newElements;
    });

    if (selectedElement === oldId) {
      setSelectedElement(newId);
    }

    toast.success('Element renamed successfully');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Canvas Area */}
      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Canvas</CardTitle>
              <div className="flex gap-2">
                <Button
                  variant={mode === 'preview' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setMode('preview')}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Preview
                </Button>
                <Button
                  variant={mode === 'edit' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setMode('edit')}
                >
                  <Edit3 className="w-4 h-4 mr-2" />
                  Edit
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {!originalSVG ? (
              <div className="h-96 flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg">
                <FileUpload onFileUpload={handleSVGUpload} />
              </div>
            ) : (
              <div className="border rounded-lg overflow-hidden shadow-inner bg-white">
                <canvas ref={canvasRef} className="max-w-full" />
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Controls Panel */}
      <div className="space-y-6">
        {/* Text Element Editor */}
        {Object.keys(textElements).length > 0 && (
          <TextElementEditor
            textElements={textElements}
            selectedElement={selectedElement}
            onUpdateElement={updateTextElement}
            onRemoveElement={removeTextElement}
            onRenameElement={renameTextElement}
            onSelectElement={setSelectedElement}
          />
        )}

        {/* Schema Output */}
        {Object.keys(textElements).length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Export Schema</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Button onClick={downloadSchema} className="flex-1">
                  <Download className="w-4 h-4 mr-2" />
                  Download Schema
                </Button>
                <Button variant="outline" onClick={regenerateSchema}>
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </div>
              <SchemaOutput textElements={textElements} />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};
