import { Hono } from 'hono';

const templates = new Hono();

const TEMPLATES = [
  { id: 't1', title: 'Net Promoter Score', type: 'nps', category: 'Business', free: true, question: 'How likely are you to recommend us to a friend?', lowLabel: 'Not at all likely', highLabel: 'Extremely likely' },
  { id: 't2', title: 'Employee Satisfaction', type: 'rating', category: 'HR', free: true, question: 'How satisfied are you with your work environment?' },
  { id: 't3', title: 'Product Feature Vote', type: 'prioritization', category: 'Product', free: true, question: 'Which feature should we build next?', options: [{ text: 'Dark mode' }, { text: 'Mobile app' }, { text: 'API access' }, { text: 'Team workspaces' }] },
  { id: 't4', title: 'Live Q&A Session', type: 'qa', category: 'Events', free: true, question: 'What questions do you have for the presenter?' },
  { id: 't5', title: 'Knowledge Quiz', type: 'quiz', category: 'Education', free: false, question: 'Test your knowledge' },
  { id: 't6', title: 'Brand Word Association', type: 'word_cloud', category: 'Marketing', free: true, question: 'Describe our brand in one word' },
];

templates.get('/', c => c.json({ templates: TEMPLATES }));
templates.get('/:id', c => {
  const t = TEMPLATES.find(t => t.id === c.req.param('id'));
  if (!t) return c.json({ error: 'Not found' }, 404);
  return c.json({ template: t });
});

export default templates;
