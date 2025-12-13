import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { BarChart2, Search, Loader2, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { diagrams, Diagram } from '@/data/diagrams';

export const DiagramFinderTool: React.FC = () => {
  const [inputText, setInputText] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [matchedDiagram, setMatchedDiagram] = useState<Diagram | null>(null);
  const [noMatch, setNoMatch] = useState(false);

  const findDiagram = async () => {
    if (!inputText.trim()) {
      return;
    }

    setIsSearching(true);
    setMatchedDiagram(null);
    setNoMatch(false);

    try {
      const { data, error } = await supabase.functions.invoke('find-diagram', {
        body: { text: inputText }
      });

      if (error) {
        console.error('Find diagram error:', error);
        return;
      }

      if (data?.diagramId) {
        const found = diagrams.find(d => d.id === data.diagramId);
        if (found) {
          setMatchedDiagram(found);
        } else {
          setNoMatch(true);
        }
      } else {
        setNoMatch(true);
      }
    } catch (error) {
      console.error('Error finding diagram:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const reset = () => {
    setInputText('');
    setMatchedDiagram(null);
    setNoMatch(false);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-gradient-brand">
          <BarChart2 className="w-5 h-5 text-primary-foreground" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">Diagram Generator</h3>
          <p className="text-xs text-muted-foreground">
            Paste question text to find the right diagram
          </p>
        </div>
      </div>

      {/* Input Area */}
      {!matchedDiagram && (
        <div className="space-y-3">
          <Textarea
            placeholder="Paste your question or topic here... e.g. 'Explain using a diagram what happens when aggregate demand increases'"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="min-h-[100px] resize-none text-sm"
          />
          
          <Button
            onClick={findDiagram}
            disabled={isSearching || !inputText.trim()}
            className="w-full bg-gradient-brand hover:opacity-90 text-primary-foreground"
            size="sm"
          >
            {isSearching ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Searching...
              </>
            ) : (
              <>
                <Search className="w-4 h-4 mr-2" />
                Find Diagram
              </>
            )}
          </Button>
        </div>
      )}

      {/* No Match Result */}
      {noMatch && (
        <div className="text-center py-4">
          <p className="text-sm text-muted-foreground mb-3">
            No matching diagram found for your text.
          </p>
          <Button variant="outline" size="sm" onClick={reset}>
            Try Again
          </Button>
        </div>
      )}

      {/* Matched Diagram */}
      {matchedDiagram && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-foreground">{matchedDiagram.title}</h4>
            <button
              onClick={reset}
              className="p-1.5 hover:bg-muted rounded-full transition-colors"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
          
          <div className="rounded-lg border border-border overflow-hidden bg-white">
            <img
              src={matchedDiagram.imagePath}
              alt={matchedDiagram.title}
              className="w-full h-auto object-contain"
            />
          </div>
          
          <Button variant="outline" size="sm" onClick={reset} className="w-full">
            Search for Another Diagram
          </Button>
        </div>
      )}
    </div>
  );
};
