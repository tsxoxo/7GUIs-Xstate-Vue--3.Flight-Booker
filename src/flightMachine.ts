import { setup, assign } from 'xstate';

const INITIAL_DATE = '02.02.2024'

type FormError = 'changeStartDate-invalid' | 'changeReturnDate-invalid' | 'dates-incompatible';
type FlightType = 'one-way' | 'return'

const areDatesFeasible = (startDate: string, ReturnDate: string) => {
  return new Date(startDate) <= new Date(ReturnDate)
}
const isValidDate = (s: string): boolean => {
  var separators = ['\\.', '\\-', '\\/'];
  var bits = s.split(new RegExp(separators.join('|'), 'g'));
  var d = new Date(bits[2], bits[1] - 1, bits[0]);
  return d.getFullYear() == bits[2] && d.getMonth() + 1 == bits[1];
}

export const flightMachine = setup({
  "types": {
    events: {} as
      { type: 'changeFlightType', 'value': string } |
      { type: 'changeStartDate', 'value': string } |
      { type: 'changeReturnDate', 'value': string } |
      { type: 'book', } |
      { type: 'closeModal', 'value': string },

    context: {} as {
      'errors': Set<FormError>,
      'flightType': FlightType,
      'startDate': string,
      'returnDate': string,
    }
  },
  actions: {
    handleConstraints: ({ context }) => {
      const { errors, flightType, startDate, returnDate } = context;

      if (!isValidDate(startDate)) {
        errors.add(`changeStartDate-invalid`)
        errors.delete('dates-incompatible')
      } else {
        errors.delete(`changeStartDate-invalid`)
      }

      if (flightType === 'one-way') {
        errors.delete(`changeReturnDate-invalid`)
        return
      }

      // flightType === 'return'
      if (!isValidDate(returnDate)) {
        errors.add(`changeReturnDate-invalid`)
        errors.delete('dates-incompatible')
        return
      } else {
        errors.delete(`changeReturnDate-invalid`)

        if (!isValidDate(startDate)) { return }

        if (!areDatesFeasible(startDate, returnDate)) {
          errors.add('dates-incompatible')
        } else {
          errors.delete('dates-incompatible')
        }
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
            {
              "type": 'handleConstraints',
            }
          ]
        },
        "changeStartDate": {
          "actions": [
            assign({
              startDate: ({ event }) => event.value,
            }),
            {
              "type": 'handleConstraints',
            }
          ]
        },
        "changeReturnDate": {
          "actions": [
            assign({
              returnDate: ({ event }) => event.value,
            }),
            {
              "type": 'handleConstraints',
            }
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