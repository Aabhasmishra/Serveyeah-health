// User routes
import { Router } from 'express';
import * as userController from '../controllers/userController.js';

const router = Router();

router.post('/', userController.createUser);
router.get('/', userController.getAllUsers);
router.get('/:id', userController.getUserById);
router.patch('/:id', userController.updateUser);
router.patch('/:id/deactivate', userController.deactivateUser);

export default router;