/* eslint-disable no-restricted-globals */

// Define worker types
const WORKER_TYPES = {
  TEXT_SUMMARIZATION: 'text-summarization'
};

let isCancelled = false;
let currentTaskUuid = null;

// Calculate sentence score based on importance and position
function calculateSentenceScore(sentence, index, totalSentences) {
  // Count words as a simple measure of importance
  const wordCount = sentence.split(/\s+/).length;
  
  // Sentences at the beginning and end are more important
  const position = index / totalSentences;
  const positionScore = position < 0.2 || position > 0.8 ? 1.5 : 1.0;
  
  // Sentences with more words might be more informative (up to a point)
  const lengthScore = Math.min(wordCount / 10, 2.0);
  
  // Sentences with certain keywords might be more important
  const keywordScore = containsKeywords(sentence) ? 1.5 : 1.0;
  
  return wordCount * positionScore * lengthScore * keywordScore;
}

// Check if a sentence contains important keywords
function containsKeywords(sentence) {
  const keywords = ['important', 'significant', 'key', 'main', 'critical', 'essential',
                   'primary', 'major', 'crucial', 'vital', 'central', 'core', 'fundamental'];
  const lowerSentence = sentence.toLowerCase();
  return keywords.some(keyword => lowerSentence.includes(keyword));
}

// Select diverse sentences while maintaining order
function selectDiverseSentences(sentences, maxSentences) {
  // Score each sentence
  const scoredSentences = sentences.map((sentence, index) => ({
    text: sentence,
    score: calculateSentenceScore(sentence, index, sentences.length),
    originalIndex: index
  }));

  // Sort by score
  const sorted = [...scoredSentences].sort((a, b) => b.score - a.score);
  
  // Select top sentences while avoiding adjacent ones
  const selectedIndices = new Set();
  for (let i = 0; i < sorted.length && selectedIndices.size < maxSentences; i++) {
    const index = sorted[i].originalIndex;
    
    // Skip if nearby sentences are already selected
    if (!selectedIndices.has(index) && 
        !selectedIndices.has(index - 1) && 
        !selectedIndices.has(index + 1)) {
      selectedIndices.add(index);
    }
  }

  // Get sentences in original order
  return sentences
    .filter((_, index) => selectedIndices.has(index))
    .sort((a, b) => sentences.indexOf(a) - sentences.indexOf(b));
}

// Main summarization function
async function summarizeText(text, uuid) {
  console.log('Starting summarization for text:', text.substring(0, 50) + '...');
  if (isCancelled) throw new Error('Task was cancelled');

  // Split text into sentences
  const sentences = text.split(/[.!?]\s+/).filter(s => s.trim().length > 0);
  console.log('Split into', sentences.length, 'sentences');
  
  // Send initial progress
  postMessage({ uuid, msgType: 'progress', progress: 20 });
  console.log('Sent initial progress update');

  // Simulate processing time for longer texts
  const processingTime = Math.min(sentences.length * 50, 3000);
  const steps = 10;
  const stepTime = processingTime / steps;
  console.log('Processing with', steps, 'steps of', stepTime, 'ms each');
  
  for (let i = 0; i < steps; i++) {
    if (isCancelled) throw new Error('Task was cancelled');
    
    // Simulate processing work
    await new Promise(resolve => setTimeout(resolve, stepTime));
    
    // Update progress
    const progress = 20 + (i + 1) * 60 / steps;
    postMessage({ uuid, msgType: 'progress', progress });
    console.log('Progress update:', progress);
  }
  
  // Select important sentences
  const summarySentences = selectDiverseSentences(sentences, Math.min(5, Math.ceil(sentences.length / 3)));
  console.log('Selected', summarySentences.length, 'sentences for summary');

  // Send final progress
  postMessage({ uuid, msgType: 'progress', progress: 100 });
  console.log('Sent final progress update');

  const summary = summarySentences.join('. ') + '.';
  console.log('Final summary:', summary);
  
  // Calculate metrics
  const originalWordCount = text.trim().split(/\s+/).length;
  const summaryWordCount = summary.trim().split(/\s+/).length;
  const compressionRatio = Math.round((summaryWordCount / originalWordCount) * 100);
  
  return {
    summary,
    originalWordCount,
    summaryWordCount,
    compressionRatio,
    originalSentenceCount: sentences.length,
    summarySentenceCount: summarySentences.length
  };
}

// Worker message handlers
self.onmessage = async (event) => {
  const { type, text, uuid } = event.data;
  currentTaskUuid = uuid;
  console.log('Received message:', event.data);
  
  try {
    if (type !== WORKER_TYPES.TEXT_SUMMARIZATION) {
      throw new Error('Invalid worker type');
    }
    const summary = await summarizeText(text, uuid);
    postMessage({ uuid, msgType: 'success', result: summary });
  } catch (error) {
    postMessage({ uuid, msgType: 'error', error: error.message });
  }
};

self.onmessageerror = (event) => {
  postMessage({ uuid: currentTaskUuid, msgType: 'error', error: event.message });
};

self.onterminate = () => {
  isCancelled = true;
};
