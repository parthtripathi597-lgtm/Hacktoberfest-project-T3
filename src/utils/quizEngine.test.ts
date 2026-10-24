import test from 'node:test';
import assert from 'node:assert/strict';
import { generateQuizFromChunks } from './quizEngine.ts';
import { chunkPlainText } from './chunker.ts';

test('generateQuizFromChunks produces grounded questions from text chunks', () => {
  const sample = `It was on a dreary night of November that I beheld the accomplishment of my toils. By the glimmer of the half-extinguished light, I saw the dull yellow eye of the creature open; it breathed hard, and a convulsive motion agitated its limbs.`;
  const chunks = chunkPlainText(sample, { bookTitle: 'Frankenstein', targetWords: 100 });

  const quiz = generateQuizFromChunks(chunks);
  assert.equal(quiz.length, 1);
  assert.ok(quiz[0].question.includes('creature'));
  assert.equal(quiz[0].options.length, 4);
  assert.equal(quiz[0].correctIndex, 0);
  assert.ok(quiz[0].explanation.includes('yellow eye'));
});
