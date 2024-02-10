import { setup, assign } from 'xstate';

const INITIAL_DATE = '02.02.2024'

const areDatesFeasible = (startDate: string, ReturnDate: string) => {
  return new Date(startDate) <= new Date(ReturnDate)
}
const isValidDate = (s: string): boolean => {
  var separators = ['\\.', '\\-', '\\/'];
  var bits = s.split(new RegExp(separators.join('|'), 'g'));
  var d = new Date(bits[2], bits[1] - 1, bits[0]);
  return d.getFullYear() == bits[2] && d.getMonth() + 1 == bits[1];
}
type FormError = 'changeStartDate-invalid' | 'changeReturnDate-invalid' | 'dates-incompatible';

export const flightMachine = setup({
  "types": {
    events: {} as
      { type: 'changeStartDate', 'value': string } |
      { type: 'changeReturnDate', 'value': string } |
      { type: 'book', } |
      { type: 'changeFlightType', 'value': string } |
      { type: 'closeModal', 'value': string },

    context: {} as {
      'flightType': 'one-way' | 'return',
      'startDate': string,
      'returnDate': string,
      'errors': Set<FormError>,
    }
  },
  actions: {
    handleConstraints: ({ context }) => {
      if (!isValidDate(context.startDate)) {
        context.errors.add(`changeStartDate-invalid`)
        context.errors.delete('dates-incompatible')
      } else {
        context.errors.delete(`changeStartDate-invalid`)
      }

      if (context.flightType === 'return') {
        if (!isValidDate(context.returnDate)) {
          context.errors.add(`changeReturnDate-invalid`)
          context.errors.delete('dates-incompatible')
          return
        } else {
          context.errors.delete(`changeReturnDate-invalid`)

          if (isValidDate(context.startDate) && !areDatesFeasible(context.startDate, context.returnDate)) {
            context.errors.add('dates-incompatible')
          } else {
            context.errors.delete('dates-incompatible')
          }
        }
      } else {
        context.errors.delete(`changeReturnDate-invalid`)
      }
    }
  },
  guards: {
    "canBook": ({ context }) => { return context.errors.size === 0 }
  },
}).createMachine({
  "id": "flightBooker",
  "initial": "waitForInput",
  "context": {
    errors: new Set([]),
    flightType: 'one-way',
    startDate: INITIAL_DATE,
    returnDate: INITIAL_DATE
  },
  "states": {
    "waitForInput": {
      "on": {
        "changeFlightType": {
          "actions": [
            assign({
              flightType: ({ event }) => event.value,
            }),
            { "type": 'handleConstraints' }
          ]
        },
        "changeStartDate": {
          "actions": [
            assign({
              startDate: ({ event }) => event.value,
            }),
            { "type": 'handleConstraints' }
          ]
        },
        "changeReturnDate": {
          "actions": [
            assign({
              returnDate: ({ event }) => event.value,
            }),
            { "type": 'handleConstraints' }
          ]
        },
        "book": {
          "target": "confirmBooking",
          "guard": "canBook"
        },
      }
    },
    "confirmBooking": {
      "on": {
        "closeModal": {
          "target": "waitForInput",
        },
      }
    },
  }
})