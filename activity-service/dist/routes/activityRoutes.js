"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const Activity_1 = __importDefault(require("../models/Activity"));
const errors_1 = require("../errors");
const router = express_1.default.Router();
router.get('/activity', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.get('x-user-id');
    const reqTaskId = req.params.taskId;
    const wantLatest = req.query.latest === 'true';
    try {
        if (wantLatest) {
            const latestActivity = yield Activity_1.default.findOne({ taskId: reqTaskId }).sort({ timestamp: -1 });
            if (!latestActivity)
                throw new errors_1.NotFound('Activity not found');
            if (latestActivity.userId.toString() !== userId) {
                throw new errors_1.ForbiddenError('Not authorized');
            }
            res.status(200).json({ 'activity': latestActivity.description });
            return;
        }
        const activities = yield Activity_1.default.find({ userId }).sort({ timestamp: -1 });
        if (activities.length === 0) {
            res.status(200).json({ 'activities': [] });
            return;
        }
        const responsePayload = activities.map(activity => ({
            id: activity._id.toString(),
            message: activity.description,
            timestamp: activity.timestamp
        }));
        res.status(200).json({ 'activities': responsePayload });
    }
    catch (error) {
        if (error instanceof errors_1.CustomError) {
            next(error);
        }
        else {
            next(new errors_1.ServerError('An intenral server error occurred', { cause: error }));
        }
    }
}));
exports.default = router;
