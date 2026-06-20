const requests = new Map();

const rateLimit = ({ windowMs = 60000, limit = 30 } = {}) => (req, res, next) => {
  const now = Date.now();
  const key = req.ip;
  const current = requests.get(key);
  if (!current || current.resetAt <= now) {
    requests.set(key, { count: 1, resetAt: now + windowMs });
    return next();
  }
  current.count += 1;
  if (current.count > limit) return res.status(429).json({ error: 'Too many requests. Please try again shortly.' });
  next();
};

setInterval(() => {
  const now = Date.now();
  for (const [key, value] of requests) if (value.resetAt <= now) requests.delete(key);
}, 60000).unref();

module.exports = { rateLimit };
