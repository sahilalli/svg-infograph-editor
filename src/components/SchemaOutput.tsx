
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { TextElement } from './SVGEditor';

interface SchemaOutputProps {
  textElements: Record<string, TextElement>;
}

export const SchemaOutput: React.FC<SchemaOutputProps> = ({ textElements }) => {
  const generateSchema = () => {
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

  const schema = generateSchema();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Generated Schema Preview</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-48 w-full rounded border bg-gray-50 p-3">
          <pre className="text-xs font-mono text-gray-700">
            {JSON.stringify(schema, null, 2)}
          </pre>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
