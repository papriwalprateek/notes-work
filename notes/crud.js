'use strict';

var express = require('express');
var config = require('../config');
var images = require('../lib/images');
var oauth2 = require('../lib/oauth2');

function getModel () {
  return require('./datastore');
}

var router = express.Router();

// Use the oauth middleware to automatically get the user's profile
// information and expose login/logout URLs to templates.
router.use(oauth2.template);

// Use the oauth middleware to ensure that only logged-in users can access
// this router's paths.
router.use(oauth2.required);

// Set Content-Type for all responses for these routes
router.use(function (req, res, next) {
  res.set('Content-Type', 'text/html');
  next();
});

router.get('/', function list (req, res, next) {
  getModel().listBy(
    req.user.id,
    10,
    req.query.pageToken,
    function (err, entities, cursor) {
      if (err) {
        return next(err);
      }
      res.render('notes/list.jade', {
        notes: entities,
        nextPageToken: cursor
      });
    }
  );
});

/**
 * GET /notes/add
 *
 * Display a form for creating a note.
 */
router.get('/add', function addForm (req, res) {
  res.render('notes/form.jade', {
    note: {},
    action: 'Add'
  });
});

/**
 * POST /notes/add
 *
 * Create a note.
 */
// [START add]
router.post(
  '/add',
  images.multer.single('image'),
  images.sendUploadToGCS,
  function insert (req, res, next) {
    var data = req.body;

    // If the user is logged in, set them as the creator of the note.
    if (req.user) {
      data.createdBy = req.user.displayName;
      data.createdById = req.user.id;
    } else {
      // Note: this condition won't occur as user can create post only when he
      // is logged in.
      data.createdBy = 'Anonymous';
    }

    // Was an image uploaded? If so, we'll use its public URL
    // in cloud storage.
    if (req.file && req.file.cloudStoragePublicUrl) {
      data.imageUrl = req.file.cloudStoragePublicUrl;
    }

    // Save the data to the database.
    getModel().create(data, function (err, savedData) {
      if (err) {
        return next(err);
      }
      res.redirect(req.baseUrl + '/' + savedData.id);
    });
  }
);
// [END add]

/**
 * GET /notes/:id/edit
 *
 * Display a note for editing.
 */
router.get('/:note/edit', function editForm (req, res, next) {
  getModel().read(req.params.note, function (err, entity) {
    if (err) {
      return next(err);
    }
    if (entity.createdById !== req.user.id) {
      return res.status(404).send('Not Found');
    }

    res.render('notes/form.jade', {
      note: entity,
      action: 'Edit'
    });
  });
});

/**
 * POST /notes/:id/edit
 *
 * Update a note.
 */
router.post(
  '/:note/edit',
  images.multer.single('image'),
  images.sendUploadToGCS,
  function update (req, res, next) {
    var data = req.body;
    if (data.createdById !== req.user.id) {
      return res.status(404).send('Not Found');
    }

    // Was an image uploaded? If so, we'll use its public URL
    // in cloud storage.
    if (req.file && req.file.cloudStoragePublicUrl) {
      req.body.imageUrl = req.file.cloudStoragePublicUrl;
    }

    getModel().update(req.params.note, data, function (err, savedData) {
      if (err) {
        return next(err);
      }
      res.redirect(req.baseUrl + '/' + savedData.id);
    });
  }
);

/**
 * GET /notes/:id
 *
 * Display a note.
 */
router.get('/:note', function get (req, res, next) {
  getModel().read(req.params.note, function (err, entity) {
    if (err) {
      return next(err);
    }
    if (entity.createdById !== req.user.id) {
      return res.status(404).send('Not Found');
    }

    res.render('notes/view.jade', {
      note: entity
    });
  });
});

/**
 * GET /notes/:id/delete
 *
 * Delete a note.
 */
router.get('/:note/delete', function _delete (req, res, next) {
  getModel().read(req.params.note, function (err, entity) {
    if (err) {
      return next(err);
    }
    if (entity.createdById !== req.user.id) {
      return res.status(404).send('Not Found');
    }
    
    getModel().delete(req.params.note, function (err) {
      if (err) {
        return next(err);
      }
      res.redirect(req.baseUrl);
    });
  });
});

/**
 * Errors on "/notes/*" routes.
 */
router.use(function handleRpcError (err, req, res, next) {
  // Format error and forward to generic error handler for logging and
  // responding to the request
  err.response = err.message;
  next(err);
});

module.exports = router;
