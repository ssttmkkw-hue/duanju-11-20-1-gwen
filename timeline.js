export function sample(story, seconds) {
  const time = Math.max(0, Math.min(story.duration, Number.isFinite(seconds) ? seconds : 0));
  const shot = story.shots.findIndex(s => time >= s.start && time < s.end);
  const index = shot === -1 ? story.shots.length - 1 : shot;
  const line = story.lines.find(l => time >= l.start && time < l.end) ?? null;
  const progress = (time - story.shots[index].start) / (story.shots[index].end - story.shots[index].start);
  return { time, index, line, progress };
}
