'use strict';

var express = require('express');
var bodyParser = require('body-parser');
var config = require('../config');

function getModel () {
  return require('./datastore');
}

var router = express.Router();

// Automatically parse request body as JSON
router.use(bodyParser.json());

/**
 * GET /api/notes
 *
 * Retrieve a page of notes (up to ten at a time).
 */
router.get('/', function list (req, res, next) {
  getModel().list(10, req.query.pageToken, function (err, entities, cursor) {
    if (err) {
      return next(err);
    }
    res.json({
      items: entities,
      nextPageToken: cursor
    });
  });
});

/**
 * POST /api/notes
 *
 * Create a new note.
 */
router.post('/', function insert (req, res, next) {
  getModel().create(req.body, function (err, entity) {
    if (err) {
      return next(err);
    }
    res.json(entity);
  });
});

/**
 * GET /api/notes/:id
 *
 * Retrieve a note.
 */
router.get('/:note', function get (req, res, next) {
  getModel().read(req.params.note, function (err, entity) {
    if (err) {
      return next(err);
    }
    res.json(entity);
  });
});

/**
 * PUT /api/notes/:id
 *
 * Update a note.
 */
router.put('/:note', function update (req, res, next) {
  getModel().update(req.params.note, req.body, function (err, entity) {
    if (err) {
      return next(err);
    }
    res.json(entity);
  });
});

/**
 * DELETE /api/notes/:id
 *
 * Delete a note.
 */
router.delete('/:note', function _delete (req, res, next) {
  getModel().delete(req.params.note, function (err) {
    if (err) {
      return next(err);
    }
    res.status(200).send('OK');
  });
});

/**
 * Errors on "/api/notes/*" routes.
 */
router.use(function handleRpcError (err, req, res, next) {
  // Format error and forward to generic error handler for logging and
  // responding to the request
  err.response = {
    message: err.message,
    internalCode: err.code
  };
  next(err);
});

module.exports = router;
