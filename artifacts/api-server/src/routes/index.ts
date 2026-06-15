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
import authoritiesRouter from "./authorities";

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
router.use(authoritiesRouter);

export default router;
