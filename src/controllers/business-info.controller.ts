import { Request, Response, NextFunction } from 'express';
import { BusinessInfoRepository } from '../repositories/business-info.repository';

export const BusinessInfoController = {
  /**
   * GET /api/business-info
   * Returns the current business information (public).
   */
  async get(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const businessInfo = await BusinessInfoRepository.get();
      res.status(200).json(businessInfo);
    } catch (err) {
      next(err);
    }
  },

  /**
   * PUT /api/business-info  [auth, admin]
   * Creates or updates the single business information document.
   */
  async upsert(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const businessInfo = await BusinessInfoRepository.upsert(req.body);
      res.status(200).json(businessInfo);
    } catch (err) {
      next(err);
    }
  },
};
