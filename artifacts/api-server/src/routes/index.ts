import { Router, type IRouter } from "express";
import healthRouter from "./health";
import memoryRouter from "./memory";
import doctrineRouter from "./doctrine";
import workflowsRouter from "./workflows";
import routingRouter from "./routing";
import scenariosRouter from "./scenarios";
import dashboardRouter from "./dashboard";

const router: IRouter = Router();

router.use(healthRouter);
router.use(memoryRouter);
router.use(doctrineRouter);
router.use(workflowsRouter);
router.use(routingRouter);
router.use(scenariosRouter);
router.use(dashboardRouter);

export default router;
