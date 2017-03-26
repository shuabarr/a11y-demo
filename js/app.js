/*globals
$
_
Handlebars
GAME_DATA
*/

var APP = (function () {
  // Strict mode.
  'use strict'

  // Ensure data exists.
  if (!GAME_DATA) {
    throw new Error('"data.js" not loaded')
  }

  // Fire it off!
  $(document).ready(function () {
    APP.go()
  })

  // Expose innards.
  return {
    // APP.state
    state: {
      cluesAcross: GAME_DATA.clues.across,
      cluesDown: GAME_DATA.clues.down,
      gameAnswers: GAME_DATA.answers,
      userAnswers: [/* Set later. */],
      showAnswers: false
    },
    // APP.go
    go: function () {
      var init = APP.init

      // Loop through "init" methods.
      Object.keys(init).forEach(function (key) {
        // Alias method.
        var method = init[key]

        // Call, if valid method.
        if (typeof method === 'function') {
          method()
        }
      })
    },
    // APP.init
    init: {
      // APP.init.handleTableInput
      handleTableInput: function () {
        var e = 'input.handleTableInput'

        $('.cw-table').off(e).on(e, '.cw-table__input', function (e) {
          var el = $(e.target)
          var value = el.val()

          value = value.replace(/\W|_/g, '')
          value = value.toUpperCase()

          var row = el.attr('data-row')
          var col = el.attr('data-col')

          el.val(value)

          APP.utils.updateUserAnswers({
            row: row,
            col: col,
            value: value
          })
        })
      },
      // APP.init.handleClueClick
      handleClueClick: function () {
        var e = 'click.handleClueClick'

        $('.cw-clues').off(e).on(e, '.cw-clues__link', function (e) {
          e.preventDefault()

          var el = $(e.target).closest('[data-row][data-col]')
          var row = el.attr('data-row')
          var col = el.attr('data-col')

          var input = [
            '.cw-table__input',
            '[data-row="' + row + '"]',
            '[data-col="' + col + '"]'
          ].join('')

          $(input).focus()
        })
      },
      // APP.init.handleToggleAnswers
      handleToggleAnswers: function () {
        var e = 'click.handleToggleAnswers'

        $('.cw-toggle-answers').off(e).on(e, function (e) {
          e.preventDefault()

          // Get state.
          var showAnswers = !APP.state.showAnswers

          // Set in conditional.
          var data

          if (showAnswers) {
            data = APP.state.gameAnswers
          } else {
            data = APP.state.userAnswers
          }

          // Update state.
          APP.state.showAnswers = showAnswers

          // Update UI.
          APP.init.tableTemplate({
            data: data,
            readonly: showAnswers,
            showValues: true
          })
        })
      },
      // APP.init.prepareData
      prepareData: function () {
        // Parse answers.
        APP.state.gameAnswers =
          APP.utils.parseGameAnswers(
            APP.state.gameAnswers
          )

        // Create empty user answers.
        APP.state.userAnswers =
          APP.utils.emptyUserAnswers(
            APP.state.gameAnswers
          )

        // Parse clues.
        APP.state.cluesAcross =
          APP.utils.parseClues(
            APP.state.cluesAcross, 'across'
          )

        // Parse clues.
        APP.state.cluesDown =
          APP.utils.parseClues(
            APP.state.cluesDown, 'down'
          )
      },
      // APP.init.cluesAcrossTemplate
      cluesAcrossTemplate: function () {
        // Get template.
        var template = $('#_cw-clue-template').html()
        template = Handlebars.compile(template)

        // Apply template.
        template = template(APP.state.cluesAcross)
        $('.cw-clues--across').html(template)
      },
      // APP.init.cluesDownTemplate
      cluesDownTemplate: function () {
        // Get template.
        var template = $('#_cw-clue-template').html()
        template = Handlebars.compile(template)

        // Apply template.
        template = template(APP.state.cluesDown)
        $('.cw-clues--down').html(template)
      },
      // APP.init.tableTemplate
      tableTemplate: function (o) {
        o = o || {}

        if (!o.data) {
          o.data = APP.state.gameAnswers
        }

        // Get template.
        var template = $('#_cw-table-template').html()
        template = Handlebars.compile(template)

        // Build template data.
        var matrixData =
          APP.utils.parseMatrixData(o)

        // Apply template.
        template = template(matrixData)
        $('.cw-table__tbody').html(template)
      }
    },
    // APP.utils
    utils: {
      // APP.utils.emptyUserAnswers
      emptyUserAnswers: function (answers) {
        // Make a copy.
        answers = _.cloneDeep(answers)

        // Loop through rows.
        answers.forEach(function (cells, i) {
          // Loop through cells.
          cells.forEach(function (value, ii) {
            if (value !== '_') {
              answers[i][ii] = ''
            }
          })
        })

        // Expose array.
        return answers
      },
      // APP.utils.parseGameAnswers
      parseGameAnswers: function (answers) {
        // Make a copy.
        answers = _.cloneDeep(answers)

        // Loop through rows.
        answers.forEach(function (cells, i) {
          // Loop through cells.
          cells.forEach(function (value, ii) {
            // Trim spaces.
            value = value || ''
            value = value.replace(/\W/g, '')

            if (value.length > 1) {
              throw new Error('Data in row ' + i + ', column ' + ii + ' is invalid. Only one is character allowed per square.')
            }

            answers[i][ii] = value.toUpperCase()
          })
        })

        // Expose array.
        return answers
      },
      // APP.utils.parseClues
      parseClues: function (clues, direction) {
        // Make a copy.
        clues = _.cloneDeep(clues)

        // Loop through clues.
        clues.forEach(function (clue) {
          if (!clue.hintAlt) {
            clue.hintAlt = clue.hint
          }

          /*
            Accessible grid description.

            - "X across, X letters"
            - "X down, X letters"
          */
          clue.description = [
            clue.number,
            direction + ',',
            clue.word.length,
            'letters'
          ].join(' ')
        })

        // Expose array.
        return clues
      },
      // APP.utils.parseMatrixData
      parseMatrixData: function (o) {
        o = o || {}
        var data = o.data || []
        var readonly = !!o.readonly
        var showValues = !!o.showValues

        // Populated in loop.
        var matrixData = []

        // Loop through rows.
        data.forEach(function (cells, i) {
          // Populated in loop.
          var rowTemplate = []

          // Loop through cells.
          cells.forEach(function (value, ii) {
            // Item for template.
            var cellTemplate = {
              disabled: value === '_',
              readonly: readonly,
              row: i + 1,
              col: ii + 1,
              value: (
                showValues
                ? value
                : ''
              )
            }

            // Loop through "across" clues.
            APP.state.cluesAcross.forEach(function (clue) {
              var row = clue.row
              var col = clue.col

              // Get zero index'ed' row.
              if (row) {
                row -= 1
              }

              // Get zero indexed col.
              if (col) {
                col -= 1
              }

              // Equal?
              if (row === i && col === ii) {
                cellTemplate.number = clue.number
              }
            })

            // Loop through "down" clues.
            APP.state.cluesDown.forEach(function (clue) {
              var row = clue.row
              var col = clue.col

              // Get zero index'ed' row.
              if (row) {
                row -= 1
              }

              // Get zero indexed col.
              if (col) {
                col -= 1
              }

              // Equal?
              if (row === i && col === ii) {
                cellTemplate.number = clue.number
              }
            })

            // Add cell template.
            rowTemplate.push(cellTemplate)
          })

          // Add row template.
          matrixData.push(rowTemplate)
        })

        // Expose array.
        return matrixData
      },
      // APP.utils.updateUserAnswers
      updateUserAnswers: function (o) {
        o = o || {}
        var row = o.row - 1
        var col = o.col - 1
        var value = o.value.toUpperCase()

        APP.state.userAnswers[row][col] = value

        // Game finished?
        APP.utils.isGameFinished()
      },
      // Determine if solved.
      isGameFinished: function () {
        var isValid =
          _.isEqual(
            APP.state.gameAnswers,
            APP.state.userAnswers
          )

        APP.utils.toggleMessage(isValid)
      },
      toggleMessage: function (bool) {
        var h = 'hidden'
        var message = $('#_cw-done-message')

        if (bool) {
          message.removeAttr(h)
        } else {
          message.attr(h, h)
        }

        message.attr('aria-hidden', !bool)
      }
    }
  }
})()