
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Trash2, Edit2, Check, X } from 'lucide-react';
import { TextElement } from './SVGEditor';

interface TextElementEditorProps {
  textElements: Record<string, TextElement>;
  selectedElement: string | null;
  onUpdateElement: (id: string, updates: Partial<TextElement>) => void;
  onRemoveElement: (id: string) => void;
  onRenameElement: (oldId: string, newId: string) => void;
  onSelectElement: (id: string | null) => void;
}

export const TextElementEditor: React.FC<TextElementEditorProps> = ({
  textElements,
  selectedElement,
  onUpdateElement,
  onRemoveElement,
  onRenameElement,
  onSelectElement,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newId, setNewId] = useState('');

  const element = selectedElement ? textElements[selectedElement] : null;

  const startRename = (id: string) => {
    setEditingId(id);
    setNewId(id);
  };

  const confirmRename = () => {
    if (editingId && newId && newId !== editingId) {
      onRenameElement(editingId, newId);
    }
    setEditingId(null);
    setNewId('');
  };

  const cancelRename = () => {
    setEditingId(null);
    setNewId('');
  };

  const fontFamilies = [
    'Arial', 'Helvetica', 'Times New Roman', 'Georgia', 'Verdana',
    'Trebuchet MS', 'Arial Black', 'Impact', 'Comic Sans MS', 'Courier New'
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Text Elements ({Object.keys(textElements).length})</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Element List */}
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {Object.values(textElements).map((el) => (
            <div
              key={el.id}
              className={`flex items-center justify-between p-2 rounded border cursor-pointer transition-colors ${
                selectedElement === el.id
                  ? 'bg-blue-50 border-blue-300'
                  : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
              }`}
              onClick={() => onSelectElement(el.id)}
            >
              <div className="flex-1 min-w-0">
                {editingId === el.id ? (
                  <div className="flex items-center gap-2">
                    <Input
                      value={newId}
                      onChange={(e) => setNewId(e.target.value)}
                      className="text-sm h-6"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') confirmRename();
                        if (e.key === 'Escape') cancelRename();
                      }}
                    />
                    <Button size="sm" variant="ghost" onClick={confirmRename}>
                      <Check className="w-3 h-3" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={cancelRename}>
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ) : (
                  <div>
                    <p className="font-medium text-sm truncate">{el.id}</p>
                    <p className="text-xs text-gray-500 truncate">
                      "{el.text}" at ({el.position.x.toFixed(0)}, {el.position.y.toFixed(0)})
                    </p>
                  </div>
                )}
              </div>
              {editingId !== el.id && (
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      startRename(el.id);
                    }}
                  >
                    <Edit2 className="w-3 h-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveElement(el.id);
                    }}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Element Editor */}
        {element && (
          <div className="space-y-4 pt-4 border-t">
            <h4 className="font-medium">Edit: {element.id}</h4>
            
            <div className="space-y-3">
              <div>
                <Label htmlFor="text">Text Content</Label>
                <Textarea
                  id="text"
                  value={element.text}
                  onChange={(e) =>
                    onUpdateElement(element.id, { text: e.target.value })
                  }
                  className="mt-1"
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="x">X Position</Label>
                  <Input
                    id="x"
                    type="number"
                    value={element.position.x}
                    onChange={(e) =>
                      onUpdateElement(element.id, {
                        position: { ...element.position, x: parseFloat(e.target.value) || 0 }
                      })
                    }
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="y">Y Position</Label>
                  <Input
                    id="y"
                    type="number"
                    value={element.position.y}
                    onChange={(e) =>
                      onUpdateElement(element.id, {
                        position: { ...element.position, y: parseFloat(e.target.value) || 0 }
                      })
                    }
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="font-size">Font Size</Label>
                <Input
                  id="font-size"
                  type="number"
                  value={element.font.size}
                  onChange={(e) =>
                    onUpdateElement(element.id, {
                      font: { ...element.font, size: parseFloat(e.target.value) || 16 }
                    })
                  }
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="font-family">Font Family</Label>
                <Select
                  value={element.font.family}
                  onValueChange={(value) =>
                    onUpdateElement(element.id, {
                      font: { ...element.font, family: value }
                    })
                  }
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {fontFamilies.map((font) => (
                      <SelectItem key={font} value={font}>
                        {font}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="color">Text Color</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    id="color"
                    type="color"
                    value={element.font.color}
                    onChange={(e) =>
                      onUpdateElement(element.id, {
                        font: { ...element.font, color: e.target.value }
                      })
                    }
                    className="w-16 h-10 p-1"
                  />
                  <Input
                    value={element.font.color}
                    onChange={(e) =>
                      onUpdateElement(element.id, {
                        font: { ...element.font, color: e.target.value }
                      })
                    }
                    className="flex-1"
                    placeholder="#000000"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
