import express from 'express';
import { getProducts, createProduct, updateProduct, deleteProduct  , getProductsByCategory} from '../controllers/productController.js';
import { authenticateUser, isAdmin } from '../middleware/authorizedUser.js';

const router = express.Router();

router.get('/', getProducts);
router.post('/', authenticateUser, isAdmin, createProduct);
router.put('/:id', authenticateUser, isAdmin, updateProduct);
router.delete('/:id', authenticateUser, isAdmin, deleteProduct);
router.get("/category/:categoryName" , getProductsByCategory)

export default router;