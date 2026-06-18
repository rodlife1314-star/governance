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

const router: IRouter = Router();

router.use(healthRouter);
router.use(memoryRouter);
router.use(doctrineRouter);
router.use(workflowsRouter);
router.use(routingRouter);
router.use(scenariosRouter);
router.use(dashboardRouter);
router.use(sovereignRouter);
router.use(geminiRouter);
router.use(dimensionsRouter);
router.use(observeRouter);
router.use(aetherRouter);
router.use(authoritiesRouter);
router.use(spectraRouter);

export default router;
