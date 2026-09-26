// The booth's "model picker": each Claude model name is also a poem form,
// and sets how many shots you take and how long you get to decorate.

export const MODELS = {
  haiku: {
    id: 'haiku',
    name: 'Haiku',
    tag: '最快',
    blurb: '3 张，像一首俳句：五、七、五',
    shots: 3,
    keep: 3,
    countdown: 3,
    first: 5,
    decorate: 75,
    layouts: ['strip3', 'hero3'],
  },
  sonnet: {
    id: 'sonnet',
    name: 'Sonnet',
    tag: '均衡',
    blurb: '拍 6 张挑 4 张，经典四格',
    shots: 6,
    keep: 4,
    countdown: 5,
    first: 6,
    decorate: 120,
    layouts: ['strip4', 'grid4'],
  },
  opus: {
    id: 'opus',
    name: 'Opus',
    tag: '最强',
    blurb: '拍 8 张挑 6 张，豪华大张慢慢修',
    shots: 8,
    keep: 6,
    countdown: 5,
    first: 6,
    decorate: 180,
    layouts: ['grid6', 'duo6'],
  },
};

export const MODEL_IDS = Object.keys(MODELS);

// Extended thinking: a longer countdown, with Claude's thoughts streamed.
export const THINKING_EXTRA = 3;
