import { describe, it, expect } from 'vitest';
import {
  allExamples,
  getExampleById,
  ecommerceExample,
  authFlowExample,
  dataPipelineExample,
  chatbotArchExample,
  microservicesExample,
} from '../src/examples';

describe('Example Scenarios', () => {
  describe('allExamples', () => {
    it('should contain 5 example scenarios', () => {
      expect(allExamples).toHaveLength(5);
    });

    it('should have unique IDs', () => {
      const ids = allExamples.map((e) => e.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(allExamples.length);
    });

    it('should all have required properties', () => {
      allExamples.forEach((example) => {
        expect(example.id).toBeDefined();
        expect(example.name).toBeDefined();
        expect(example.description).toBeDefined();
        expect(example.initialDiagram).toBeDefined();
        expect(example.suggestedPrompts).toBeDefined();
        expect(example.suggestedPrompts.length).toBeGreaterThan(0);
        expect(example.expectedEvolution).toBeDefined();
      });
    });
  });

  describe('getExampleById', () => {
    it('should find example by ID', () => {
      const example = getExampleById('ecommerce');
      expect(example).toBeDefined();
      expect(example?.name).toBe('E-Commerce System');
    });

    it('should return undefined for unknown ID', () => {
      const example = getExampleById('nonexistent');
      expect(example).toBeUndefined();
    });
  });

  describe('E-Commerce Example', () => {
    it('should have valid mermaid diagram', () => {
      expect(ecommerceExample.initialDiagram).toContain('flowchart');
      expect(ecommerceExample.initialDiagram).toContain('Client');
      expect(ecommerceExample.initialDiagram).toContain('API');
      expect(ecommerceExample.initialDiagram).toContain('Database');
    });

    it('should have cache-related suggested prompt', () => {
      const hasCachePrompt = ecommerceExample.suggestedPrompts.some(
        (p) => p.toLowerCase().includes('cach')
      );
      expect(hasCachePrompt).toBe(true);
    });
  });

  describe('Auth Flow Example', () => {
    it('should have sequence diagram', () => {
      expect(authFlowExample.initialDiagram).toContain('sequenceDiagram');
      expect(authFlowExample.initialDiagram).toContain('User');
      expect(authFlowExample.initialDiagram).toContain('JWT');
    });

    it('should have OAuth suggested prompt', () => {
      const hasOAuthPrompt = authFlowExample.suggestedPrompts.some(
        (p) => p.toLowerCase().includes('oauth')
      );
      expect(hasOAuthPrompt).toBe(true);
    });
  });

  describe('Data Pipeline Example', () => {
    it('should have ETL components', () => {
      expect(dataPipelineExample.initialDiagram).toContain('ETL');
      expect(dataPipelineExample.initialDiagram).toContain('Sources');
      expect(dataPipelineExample.initialDiagram).toContain('Data Warehouse');
    });

    it('should have error handling suggested prompt', () => {
      const hasErrorPrompt = dataPipelineExample.suggestedPrompts.some(
        (p) => p.toLowerCase().includes('error')
      );
      expect(hasErrorPrompt).toBe(true);
    });
  });

  describe('Chatbot Architecture Example', () => {
    it('should have LLM component', () => {
      expect(chatbotArchExample.initialDiagram).toContain('LLM');
      expect(chatbotArchExample.initialDiagram).toContain('Chat');
    });

    it('should have RAG suggested prompt', () => {
      const hasRAGPrompt = chatbotArchExample.suggestedPrompts.some(
        (p) => p.toLowerCase().includes('rag')
      );
      expect(hasRAGPrompt).toBe(true);
    });
  });

  describe('Microservices Example', () => {
    it('should have monolith structure', () => {
      expect(microservicesExample.initialDiagram).toContain('Monolith');
      expect(microservicesExample.initialDiagram).toContain('Modules');
    });

    it('should have suggested prompts for extraction', () => {
      const hasExtractionPrompt = microservicesExample.suggestedPrompts.some(
        (p) => p.toLowerCase().includes('extract') || p.toLowerCase().includes('separate')
      );
      expect(hasExtractionPrompt).toBe(true);
    });
  });
});
