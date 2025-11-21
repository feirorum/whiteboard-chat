import React, { useRef, useState, useCallback, useEffect } from 'react';
import { useStore } from '../../store';
import { MermaidRenderer } from '../../components/MermaidRenderer';
import { ChatInterface } from '../../components/ChatInterface';
import type { Annotation } from '../../types';
import './AnnotationLayer.css';

type Tool = Annotation['type'] | null;

export const AnnotationLayer: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPath, setCurrentPath] = useState<{ x: number; y: number }[]>([]);

  const {
    annotationState,
    addAnnotation,
    clearAnnotations,
    setAnnotationTool,
    setAnnotationColor,
  } = useStore();

  const tools: { id: Tool; label: string; icon: string }[] = [
    { id: 'freehand', label: 'Freehand', icon: '✏️' },
    { id: 'circle', label: 'Circle', icon: '⭕' },
    { id: 'arrow', label: 'Arrow', icon: '➡️' },
    { id: 'strikethrough', label: 'Strike', icon: '❌' },
    { id: 'text', label: 'Text', icon: '📝' },
    { id: null, label: 'Select', icon: '👆' },
  ];

  const colors = ['#e94560', '#4ecca3', '#ffc107', '#00d4ff', '#ff6b6b', '#ffffff'];

  // Redraw canvas when annotations change
  useEffect(() => {
    redrawCanvas();
  }, [annotationState.annotations]);

  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    annotationState.annotations.forEach((annotation) => {
      ctx.strokeStyle = annotation.color;
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      switch (annotation.type) {
        case 'freehand':
          if (annotation.points.length > 1) {
            ctx.beginPath();
            ctx.moveTo(annotation.points[0].x, annotation.points[0].y);
            annotation.points.forEach((p) => ctx.lineTo(p.x, p.y));
            ctx.stroke();
          }
          break;

        case 'circle':
          if (annotation.points.length >= 2) {
            const [start, end] = annotation.points;
            const radius = Math.sqrt(
              Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2)
            );
            ctx.beginPath();
            ctx.arc(start.x, start.y, radius, 0, Math.PI * 2);
            ctx.stroke();
          }
          break;

        case 'arrow':
          if (annotation.points.length >= 2) {
            const [start, end] = annotation.points;
            ctx.beginPath();
            ctx.moveTo(start.x, start.y);
            ctx.lineTo(end.x, end.y);
            ctx.stroke();

            // Arrow head
            const angle = Math.atan2(end.y - start.y, end.x - start.x);
            const headLength = 15;
            ctx.beginPath();
            ctx.moveTo(end.x, end.y);
            ctx.lineTo(
              end.x - headLength * Math.cos(angle - Math.PI / 6),
              end.y - headLength * Math.sin(angle - Math.PI / 6)
            );
            ctx.moveTo(end.x, end.y);
            ctx.lineTo(
              end.x - headLength * Math.cos(angle + Math.PI / 6),
              end.y - headLength * Math.sin(angle + Math.PI / 6)
            );
            ctx.stroke();
          }
          break;

        case 'strikethrough':
          if (annotation.points.length >= 2) {
            const [start, end] = annotation.points;
            ctx.beginPath();
            ctx.moveTo(start.x, start.y);
            ctx.lineTo(end.x, end.y);
            ctx.stroke();
            // Cross line
            ctx.beginPath();
            ctx.moveTo(start.x, end.y);
            ctx.lineTo(end.x, start.y);
            ctx.stroke();
          }
          break;

        case 'text':
          if (annotation.text && annotation.points.length > 0) {
            ctx.font = '16px sans-serif';
            ctx.fillStyle = annotation.color;
            ctx.fillText(annotation.text, annotation.points[0].x, annotation.points[0].y);
          }
          break;
      }
    });
  }, [annotationState.annotations]);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (!annotationState.currentTool || !canvasRef.current) return;

      const rect = canvasRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      if (annotationState.currentTool === 'text') {
        const text = prompt('Enter annotation text:');
        if (text) {
          addAnnotation({
            type: 'text',
            points: [{ x, y }],
            color: annotationState.currentColor,
            text,
          });
        }
        return;
      }

      setIsDrawing(true);
      setCurrentPath([{ x, y }]);
    },
    [annotationState.currentTool, annotationState.currentColor, addAnnotation]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDrawing || !canvasRef.current) return;

      const rect = canvasRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      setCurrentPath((prev) => [...prev, { x, y }]);

      // Live preview for freehand
      if (annotationState.currentTool === 'freehand') {
        const ctx = canvasRef.current.getContext('2d');
        if (ctx && currentPath.length > 0) {
          ctx.strokeStyle = annotationState.currentColor;
          ctx.lineWidth = 3;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(currentPath[currentPath.length - 1].x, currentPath[currentPath.length - 1].y);
          ctx.lineTo(x, y);
          ctx.stroke();
        }
      }
    },
    [isDrawing, currentPath, annotationState.currentTool, annotationState.currentColor]
  );

  const handleMouseUp = useCallback(() => {
    if (!isDrawing || !annotationState.currentTool || currentPath.length === 0) {
      setIsDrawing(false);
      return;
    }

    addAnnotation({
      type: annotationState.currentTool,
      points: currentPath,
      color: annotationState.currentColor,
    });

    setIsDrawing(false);
    setCurrentPath([]);
  }, [isDrawing, currentPath, annotationState.currentTool, annotationState.currentColor, addAnnotation]);

  const handleCaptureForSend = useCallback(async (): Promise<string> => {
    // Capture the combined diagram + annotations
    if (!containerRef.current) return '';

    const { toPng } = await import('html-to-image');
    return await toPng(containerRef.current, {
      backgroundColor: '#1a1a2e',
    });
  }, []);

  const buildContextInfo = useCallback((): string => {
    if (annotationState.annotations.length === 0) {
      return '';
    }
    const annotationTypes = annotationState.annotations.map((a) => a.type);
    return `The user has drawn annotations on the diagram (visible in the image): ${annotationTypes.join(', ')}. Please interpret these annotations and apply the requested changes.`;
  }, [annotationState.annotations]);

  // Resize canvas to match container
  useEffect(() => {
    const resizeCanvas = () => {
      if (canvasRef.current && containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        canvasRef.current.width = rect.width;
        canvasRef.current.height = rect.height;
        redrawCanvas();
      }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, [redrawCanvas]);

  return (
    <div className="annotation-layer approach-layout">
      <div className="diagram-panel">
        <div className="panel-header">
          <h3>Diagram</h3>
          <div className="annotation-tools">
            {tools.map((tool) => (
              <button
                key={tool.id || 'select'}
                className={`tool-btn ${annotationState.currentTool === tool.id ? 'active' : ''}`}
                onClick={() => setAnnotationTool(tool.id)}
                title={tool.label}
              >
                {tool.icon}
              </button>
            ))}
            <div className="tool-divider" />
            {colors.map((color) => (
              <button
                key={color}
                className={`color-btn ${annotationState.currentColor === color ? 'active' : ''}`}
                style={{ backgroundColor: color }}
                onClick={() => setAnnotationColor(color)}
              />
            ))}
            <div className="tool-divider" />
            <button
              onClick={clearAnnotations}
              className="clear-btn"
              disabled={annotationState.annotations.length === 0}
            >
              Clear
            </button>
          </div>
        </div>
        <div className="diagram-instructions">
          Select a tool and draw annotations over the diagram
        </div>
        <div className="diagram-with-canvas" ref={containerRef}>
          <MermaidRenderer />
          <canvas
            ref={canvasRef}
            className="annotation-canvas"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          />
        </div>
      </div>

      <div className="chat-panel">
        <ChatInterface
          onSendWithImage={handleCaptureForSend}
          contextInfo={buildContextInfo()}
        />
      </div>
    </div>
  );
};

export default AnnotationLayer;
