// swagger-doc.js - API documentation using JSDoc format

/**
 * @swagger
 * components:
 *   schemas:
 *     Point:
 *       type: object
 *       required:
 *         - lat
 *         - lng
 *       properties:
 *         lat:
 *           type: number
 *           description: Latitude coordinate
 *         lng:
 *           type: number
 *           description: Longitude coordinate
 *       example:
 *         lat: 32.265
 *         lng: -97.785
 *
 *     Feature:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Unique identifier from OpenStreetMap
 *         type:
 *           type: string
 *           description: The type of feature (building, road, water, utility, etc.)
 *         name:
 *           type: string
 *           description: Human-readable name for the feature
 *         geometry:
 *           type: object
 *           properties:
 *             type:
 *               type: string
 *               description: Geometry type (LineString, Polygon, etc.)
 *             coordinates:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Point'
 *         properties:
 *           type: object
 *           description: Original properties from OpenStreetMap
 *
 *     FeatureRequest:
 *       type: object
 *       required:
 *         - polygon
 *         - featureTypes
 *       properties:
 *         polygon:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Point'
 *           description: Array of points forming a closed polygon
 *         featureTypes:
 *           type: array
 *           items:
 *             type: string
 *             enum: [highway, building, waterway, power, landuse, boundary]
 *           description: Types of features to extract
 *
 *     FeatureResponse:
 *       type: object
 *       properties:
 *         metadata:
 *           type: object
 *           properties:
 *             count:
 *               type: integer
 *               description: Total number of features found
 *             timestamp:
 *               type: string
 *               format: date-time
 *               description: When the request was processed
 *             source:
 *               type: string
 *               description: Data source information
 *         features:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Feature'
 *
 *     Error:
 *       type: object
 *       properties:
 *         error:
 *           type: string
 *           description: Error message
 *         details:
 *           type: string
 *           description: Additional error details
 */

/**
 * @swagger
 * /api/features:
 *   post:
 *     summary: Extract features from OpenStreetMap within a given polygon
 *     description: Returns features of specified types that are contained within the provided polygon
 *     tags: [Features]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/FeatureRequest'
 *     responses:
 *       200:
 *         description: Features successfully extracted
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/FeatureResponse'
 *       400:
 *         description: Invalid request parameters
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */