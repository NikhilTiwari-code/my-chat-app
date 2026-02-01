"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logout = exports.refresh = exports.login = exports.register = void 0;
const auth_validation_1 = require("./auth.validation");
const auth_service_1 = require("./auth.service");
const register = async (req, res) => {
    const data = auth_validation_1.registerSchema.parse(req.body);
    const result = await (0, auth_service_1.registerUser)(data.email, data.username, data.password);
    res.status(201).json({
        user: { id: result.user.id, email: result.user.email, username: result.user.username },
        accessToken: result.accessToken,
        refreshToken: result.refreshToken
    });
};
exports.register = register;
const login = async (req, res) => {
    const data = auth_validation_1.loginSchema.parse(req.body);
    const result = await (0, auth_service_1.loginUser)(data.identifier, data.password);
    res.json({
        user: { id: result.user.id, email: result.user.email, username: result.user.username },
        accessToken: result.accessToken,
        refreshToken: result.refreshToken
    });
};
exports.login = login;
const refresh = async (req, res) => {
    const data = auth_validation_1.refreshSchema.parse(req.body);
    const result = await (0, auth_service_1.refreshTokens)(data.refreshToken);
    res.json(result);
};
exports.refresh = refresh;
const logout = async (req, res) => {
    const data = auth_validation_1.logoutSchema.parse(req.body);
    const result = await (0, auth_service_1.logoutUser)(data.refreshToken);
    res.json(result);
};
exports.logout = logout;
