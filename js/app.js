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

  // Direction context.
  var ACROSS = 'across'
  var DOWN = 'down'

  // Key codes.
  var UP_ARROW = 38
  var LEFT_ARROW = 37
  var RIGHT_ARROW = 39
  var DOWN_ARROW = 40

  // Expose innards.
  return {
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
      // APP.init.defaultState
      defaultState: function () {
        APP.state = GAME_DATA
        APP.state.showAnswers = false

        APP.state.context = {
          direction: ACROSS,
          row: 0,
          col: 0
        }

        // Parse game answers.
        APP.state.gameAnswers =
          APP.utils.parseGameAnswers(
            APP.state.gameAnswers
          )

        // Parse clues.
        APP.state.cluesAcross =
          APP.utils.parseClues(
            APP.state.cluesAcross, ACROSS
          )

        // Parse clues.
        APP.state.cluesDown =
          APP.utils.parseClues(
            APP.state.cluesDown, DOWN
          )

        // Does user data exist?
        if (!APP.state.userAnswers) {
          // Create empty set.
          APP.state.userAnswers =
            APP.utils.emptyUserAnswers(
              APP.state.gameAnswers
            )
        }
      },
      // APP.init.handleInputChange
      handleInputChange: function () {
        var x = 'input.handleInputChange'

        $('.cw-table').off(x).on(x, '.cw-table__input', function (e) {
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

          APP.utils.updateContext({
            row: row,
            col: col
          })
        })
      },
      // APP.init.handleInputBlur
      handleInputBlur: function () {
        var x = 'blur.handleInputBlur'

        $('.cw-table').off(x).on(x, '.cw-table__input', function (e) {
          var c = 'cw-active-direction'
          $('.' + c).removeClass(c)
        })
      },
      // APP.init.handleInputFocus
      handleInputFocus: function () {
        var x1 = 'click.handleInputFocus'
        var x2 = 'focus.handleInputFocus'

        // Used later.
        var timer

        $('.cw-table').off(x1).on(x1, '.cw-table__input', function (e) {
          var el = $(e.target)
          var row = el.attr('data-row')
          var col = el.attr('data-col')

          APP.utils.updateContext({
            row: row,
            col: col
          })
        })

        $('.cw-table').off(x2).on(x2, '.cw-table__input', function (e) {
          var el = $(e.target)
          var row = el.attr('data-row')
          var col = el.attr('data-col')

          APP.utils.updateContext({
            row: row,
            col: col
          })
        })
      },
      // APP.init.handleInputArrows
      handleInputArrows: function () {
        var x = 'keydown.handleInputArrows'

        $('.cw-table').off(x).on(x, '.cw-table__input', function (e) {
          var el = $(e.target)
          var key = e.keyCode

          // Parse the DOM.
          var td = el.closest('td')
          var tdIndex = td.index()

          var tr = td.closest('tr')
          var trIndex = tr.index()

          var tdAll = tr.find('td')
          var trAll = tr.closest('tbody').find('tr')

          // Any arrow key?
          var isArrow = (
            key === UP_ARROW ||
            key === LEFT_ARROW ||
            key === RIGHT_ARROW ||
            key === DOWN_ARROW
          )

          // Ensure valid arrow press.
          var isArrowUp = (
            key === UP_ARROW &&
            trIndex !== 0
          )

          var isArrowLeft = (
            key === LEFT_ARROW &&
            tdIndex !== 0
          )

          var isArrowRight = (
            key === RIGHT_ARROW &&
            tdIndex !== tdAll.length - 1
          )

          var isArrowDown = (
            key === DOWN_ARROW &&
            trIndex !== trAll.length - 1
          )

          // Set in conditional.
          var context = {}
          var inputNext

          // =========
          // UP ARROW.
          // =========
          if (isArrowUp) {
            context.direction = DOWN

            inputNext = (
              trAll
              .eq(trIndex - 1)
              .find('td')
              .eq(tdIndex)
              .find('input')
            )

          // ===========
          // LEFT ARROW.
          // ===========
          } else if (isArrowLeft) {
            context.direction = ACROSS

            inputNext = (
              tdAll
              .eq(tdIndex - 1)
              .find('input')
            )

          // ============
          // RIGHT ARROW.
          // ============
          } else if (isArrowRight) {
            context.direction = ACROSS

            inputNext = (
              tdAll
              .eq(tdIndex + 1)
              .find('input')
            )

          // ===========
          // DOWN ARROW.
          // ===========
          } else if (isArrowDown) {
            context.direction = DOWN

            inputNext = (
              trAll
              .eq(trIndex + 1)
              .find('td')
              .eq(tdIndex)
              .find('input')
            )
          }

          // Valid input?
          var isInputValid = (
            inputNext &&
            inputNext.length &&
            inputNext.not(':disabled')
          )

          // Cancel default action.
          if (isArrow) {
            e.preventDefault()
          }

          // Valid input?
          if (isInputValid) {
            // Get row and col.
            context.row = inputNext.attr('data-row')
            context.col = inputNext.attr('data-col')
          }

          // Update context?
          if (Object.keys(context).length) {
            APP.utils.updateContext(context)
          }
        })
      },
      // APP.init.handleClueClick
      handleClueClick: function () {
        var x = 'click.handleClueClick'

        $('.cw-clues').off(x).on(x, '.cw-clues__link', function (e) {
          e.preventDefault()

          var el = $(e.target).closest('[data-row][data-col]')
          var direction = el.attr('data-direction')
          var row = el.attr('data-row') - 1
          var col = el.attr('data-col') - 1

          APP.utils.updateContext({
            direction: direction,
            row: row,
            col: col
          })
        })
      },
      // APP.init.handleToggleAnswers
      handleToggleAnswers: function () {
        var x = 'click.handleToggleAnswers'

        $('.cw-toggle-answers').off(x).on(x, function (e) {
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
      // APP.init.cluesAcrossTemplate
      cluesAcrossTemplate: function () {
        // Get template.
        var template = $('#_cw-clue-template').html()
        template = template.replace(/\s+/g, ' ')
        template = Handlebars.compile(template)

        // Apply template.
        template = template(APP.state.cluesAcross)
        $('.cw-clues--across').html(template)
      },
      // APP.init.cluesDownTemplate
      cluesDownTemplate: function () {
        // Get template.
        var template = $('#_cw-clue-template').html()
        template = template.replace(/\s+/g, ' ')
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
        template = template.replace(/\s+/g, ' ')
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
            'letters.'
          ].join(' ')

          // Direction: "across" or "down".
          clue.direction = direction
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
              row: i,
              col: ii,
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

              // Equal?
              if (
                row === i + 1 &&
                col === ii + 1
              ) {
                cellTemplate.number = clue.number
              }
            })

            // Loop through "down" clues.
            APP.state.cluesDown.forEach(function (clue) {
              var row = clue.row
              var col = clue.col

              // Equal?
              if (
                row === i + 1 &&
                col === ii + 1
              ) {
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
        var row = o.row
        var col = o.col
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
      // Toggle "done" message.
      toggleMessage: function (bool) {
        var h = 'hidden'
        var message = $('#_cw-done-message')

        if (bool) {
          message.removeAttr(h)
        } else {
          message.attr(h, h)
        }

        message.attr('aria-hidden', !bool)
      },
      // Update [X,Y] and direction.
      updateContext: function (o) {
        o = o || {}

        var direction = o.direction
        var row = o.row
        var col = o.col

        if (!direction) {
          direction = APP.state.context.direction
        }

        if (isNaN(row)) {
          row = APP.state.context.row
        }

        if (isNaN(col)) {
          col = APP.state.context.col
        }

        APP.state.context = {
          direction: direction,
          row: row,
          col: col
        }

        APP.utils.updateSquare(APP.state.context)
        APP.utils.updateDirection(APP.state.context)
      },
      // Focus active square.
      updateSquare: function (o) {
        o = o || {}

        var row = o.row
        var col = o.col

        var str = [
          'input',
          '[data-row="',
          row,
          '"]',
          '[data-col="',
          col,
          '"]'
        ].join('')

        $(str).select()
      },
      // Update direction UI.
      updateDirection: function (o) {
        o = o || {}

        var direction = o.direction
        var row = o.row
        var col = o.col

        // Set in conditional.
        var num
        var tag

        if (direction === ACROSS) {
          tag = 'tr'
          num = row
        } else if (direction === DOWN) {
          tag = 'col'
          num = col
        }

        var parent = '.cw-table'
        var c = 'cw-active-direction'

        var child = [
          tag,
          '[data-index="',
          num,
          '"]'
        ].join('')

        var str = [
          parent,
          child
        ].join(' ')

        var oldEl = $('.' + c)
        var newEl = $(str)

        oldEl.removeClass(c)
        newEl.addClass(c)
      }
    }
  }
})()
