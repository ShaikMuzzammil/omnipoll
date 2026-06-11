import type { Poll, PollResults } from '@/lib/types';

export function computeResults(poll: Poll): PollResults {
  const r: PollResults = {
    participants: poll.participants?.length || 0,
    totalVotes: poll.responses.length,
  };
  const type = poll.type;

  // ── Multiple choice / image choice / true_false / countdown_vote
  if (['multiple_choice', 'image_choice', 'true_false', 'countdown_vote', 'bracket'].includes(type)) {
    const counts: Record<string, number> = {};
    poll.options.forEach((o) => { counts[o.id] = 0; });
    poll.responses.forEach((res) => {
      const ans = res.answer as string;
      if (counts[ans] !== undefined) counts[ans]++;
    });
    const total = Object.values(counts).reduce((a, b) => a + b, 0);
    r.options = poll.options.map((o) => ({
      ...o,
      votes: counts[o.id] || 0,
      pct: total ? Math.round(((counts[o.id] || 0) / total) * 100) : 0,
    }));
  }

  // ── Word cloud / open text
  if (type === 'word_cloud' || type === 'open_text') {
    const freq: Record<string, number> = {};
    poll.responses.forEach((res) => {
      const text = String(res.answer || '').trim().toLowerCase();
      if (!text) return;
      if (type === 'word_cloud') {
        text.split(/\s+/).filter((w) => w.length > 2).forEach((w) => {
          freq[w] = (freq[w] || 0) + 1;
        });
      } else {
        freq[text] = (freq[text] || 0) + 1;
      }
    });
    r.words = Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 60).map(([text, count]) => ({ text, count }));
    r.submissions = poll.responses.map((res) => ({ ...res }));
  }

  // ── Fill blank
  if (type === 'fill_blank') {
    r.answers = poll.responses.map((res) => String(res.answer || '')).filter(Boolean);
  }

  // ── Q&A
  if (type === 'qa') {
    r.questions = [...(poll.qaQuestions || [])].sort((a, b) => b.upvotes - a.upvotes);
  }

  // ── Quiz
  if (type === 'quiz') {
    r.leaderboard = [...(poll.quizSubmissions || [])]
      .sort((a, b) => b.score - a.score)
      .slice(0, 20)
      .map((s) => ({
        participantId: s.participantId,
        name: s.participantName || 'Anonymous',
        score: s.score,
        correct: s.correct || 0,
        answered: s.answered || 0,
      }));
  }

  // ── Rating / NPS
  if (type === 'rating' || type === 'nps') {
    const nums = poll.responses.map((res) => Number(res.answer)).filter((n) => !isNaN(n));
    r.average = nums.length ? Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 10) / 10 : 0;
    const dist: Record<string, number> = {};
    nums.forEach((n) => { dist[String(n)] = (dist[String(n)] || 0) + 1; });
    r.distribution = dist;
    if (type === 'nps') {
      const total = nums.length || 1;
      const detractors = nums.filter((n) => n <= 6).length;
      const passives = nums.filter((n) => n === 7 || n === 8).length;
      const promoters = nums.filter((n) => n >= 9).length;
      r.detractors = detractors;
      r.passives = passives;
      r.promoters = promoters;
      r.npsScore = Math.round(((promoters - detractors) / total) * 100);
    }
  }

  // ── Slider
  if (type === 'slider') {
    const nums = poll.responses.map((res) => Number(res.answer)).filter((n) => !isNaN(n));
    r.average = nums.length ? Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 10) / 10 : 0;
    const dist: Record<string, number> = {};
    nums.forEach((n) => {
      const bucket = String(Math.round(n / 10) * 10);
      dist[bucket] = (dist[bucket] || 0) + 1;
    });
    r.distribution = dist;
  }

  // ── Ranking
  if (type === 'ranking') {
    const pointMap: Record<string, number> = {};
    poll.options.forEach((o) => { pointMap[o.id] = 0; });
    poll.responses.forEach((res) => {
      const ranked = Array.isArray(res.answer) ? (res.answer as string[]) : [];
      ranked.forEach((id, idx) => {
        if (pointMap[id] !== undefined) pointMap[id] += poll.options.length - idx;
      });
    });
    r.rankingResults = poll.options
      .map((o) => ({
        id: o.id,
        text: o.text,
        points: pointMap[o.id] || 0,
        avgRank: poll.responses.length ? (pointMap[o.id] / poll.responses.length) : 0,
      }))
      .sort((a, b) => b.points - a.points);
  }

  // ── Matrix
  if (type === 'matrix') {
    const matrixResults: Record<string, Record<string, number>> = {};
    (poll.settings?.matrixRows || []).forEach((row) => {
      matrixResults[row.id] = {};
      (poll.settings?.matrixColumns || []).forEach((col) => {
        matrixResults[row.id][col.id] = 0;
      });
    });
    poll.responses.forEach((res) => {
      const answers = res.answer as Record<string, string> || {};
      Object.entries(answers).forEach(([rowId, colId]) => {
        if (matrixResults[rowId]?.[colId] !== undefined) matrixResults[rowId][colId]++;
      });
    });
    r.matrixResults = matrixResults;
  }

  // ── Emoji reaction
  if (type === 'emoji_reaction') {
    const counts: Record<string, number> = {};
    poll.responses.forEach((res) => {
      const e = String(res.answer);
      counts[e] = (counts[e] || 0) + 1;
    });
    r.emojiCounts = counts;
  }

  // ── Heatmap
  if (type === 'heatmap') {
    r.heatmapPoints = poll.responses
      .map((res) => res.answer as { x: number; y: number })
      .filter(Boolean);
  }

  // ── Prioritization
  if (type === 'prioritization') {
    const totals: Record<string, number> = {};
    poll.options.forEach((o) => { totals[o.id] = 0; });
    poll.responses.forEach((res) => {
      const allocation = res.answer as Record<string, number> || {};
      Object.entries(allocation).forEach(([id, pts]) => {
        if (totals[id] !== undefined) totals[id] += Number(pts);
      });
    });
    r.options = poll.options
      .map((o) => ({
        ...o,
        votes: totals[o.id] || 0,
        pct: poll.responses.length ? Math.round((totals[o.id] / poll.responses.length)) : 0,
      }))
      .sort((a, b) => b.votes - a.votes);
  }

  // ── Live matching
  if (type === 'live_matching') {
    const pairs = poll.settings?.matchingPairs || [];
    r.matchingResults = pairs.map((pair) => {
      const correct = poll.responses.filter((res) => {
        const ans = res.answer as Record<string, string> || {};
        return ans[pair.id] === pair.right;
      }).length;
      return { left: pair.left, right: pair.right, correct, total: poll.responses.length };
    });
  }

  return r;
}
