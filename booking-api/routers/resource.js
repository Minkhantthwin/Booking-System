const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const ResourceController = require('../controller/resource');

router.post('/', auth(true), ResourceController.createResource);

router.get('/', auth(true), ResourceController.getAllResources);

router.get('/:id', auth(true), ResourceController.getResourceById);

module.exports = { resourceRouter: router };