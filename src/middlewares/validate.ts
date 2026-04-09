import { NextFunction, Request, Response } from "express";
import { ZodSchema } from "zod";

export const validateParams = (schema: ZodSchema) =>
  (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.params);
    if (!result.success) {
      return res.status(400).json({
        error: "validation_error",
        message: "Parametres de route invalides",
        details: result.error.flatten()
      });
    }

    req.params = result.data as typeof req.params;
    return next();
  };

export const validateQuery = (schema: ZodSchema) =>
  (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      return res.status(400).json({
        error: "validation_error",
        message: "Parametres de requete invalides",
        details: result.error.flatten()
      });
    }

    res.locals.query = result.data;
    return next();
  };

export const validateBody = (schema: ZodSchema) =>
  (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        error: "validation_error",
        message: "Donnees du formulaire invalides",
        details: result.error.flatten()
      });
    }

    res.locals.body = result.data;
    return next();
  };
