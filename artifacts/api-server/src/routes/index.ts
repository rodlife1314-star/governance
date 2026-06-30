import { Router, type IRouter } from "express";
import healthRouter from "./health";
import memoryRouter from "./memory";
import doctrineRouter from "./doctrine";
import workflowsRouter from "./workflows";
import routingRouter from "./routing";
import scenariosRouter from "./scenarios";
import dashboardRouter from "./dashboard";
import sovereignRouter from "./sovereign";
import geminiRouter from "./gemini";
import dimensionsRouter from "./dimensions";
import observeRouter from "./observe";
import aetherRouter from "./aether";
import authoritiesRouter from "./authorities";
import spectraRouter from "./spectra";
import { operatorAuth } from "../middlewares/operatorAuth";

const router: IRouter = Router();

// Open — reads only, or stateless compute (persist nothing)
router.use(healthRouter);
router.use(dashboardRouter);
router.use(routingRouter);
router.use(geminiRouter);
router.use(dimensionsRouter);
router.use(observeRouter);
router.use(aetherRouter);
router.use(spectraRouter);

// Gated — state-mutating endpoints (POST/PUT/PATCH/DELETE require operator token)
// GET routes on these routers pass through operatorAuth unchanged
router.use(operatorAuth, memoryRouter);
router.use(operatorAuth, doctrineRouter);
router.use(operatorAuth, workflowsRouter);
router.use(operatorAuth, scenariosRouter);
router.use(operatorAuth, sovereignRouter);
router.use(operatorAuth, authoritiesRouter);

export default router;
