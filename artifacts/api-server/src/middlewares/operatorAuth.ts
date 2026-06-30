import type { RequestHandler } from "express";

const OPERATOR_TOKEN = process.env.OPERATOR_TOKEN;
const IS_PROD = process.env.NODE_ENV === "production";

const WRITE_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

export const operatorAuth: RequestHandler = (req, res, next) => {
  if (!WRITE_METHODS.has(req.method)) {
    next();
    return;
  }

  if (!OPERATOR_TOKEN) {
    if (IS_PROD) {
      res.status(503).json({
        success: false,
        error: "Write endpoints unavailable — OPERATOR_TOKEN not configured on this deployment",
      });
      return;
    }
    req.log.warn(
      { path: req.path, method: req.method },
      "OPERATOR_TOKEN unset — write request allowed in dev mode (set token before deploying)",
    );
    next();
    return;
  }

  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Bearer ")) {
    res.status(401).json({ success: false, error: "Authorization required — provide: Bearer <OPERATOR_TOKEN>" });
    return;
  }

  const token = auth.slice(7);
  if (token !== OPERATOR_TOKEN) {
    res.status(401).json({ success: false, error: "Invalid operator token" });
    return;
  }

  next();
};
