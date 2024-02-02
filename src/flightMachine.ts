import { setup, assign } from 'xstate';

const INITIAL_DATE = '02.02.2024'

const checkIfDatesFeasible = (startDate: string, ReturnDate: string) => {
  return startDate > ReturnDate
}
const isValidDate = (s: string) => {
  var separators = ['\\.', '\\-', '\\/'];
  var bits = s.split(new RegExp(separators.join('|'), 'g'));
  var d = new Date(bits[2], bits[1] - 1, bits[0]);
  return d.getFullYear() == bits[2] && d.getMonth() + 1 == bits[1];
}

export const machine = setup({
  "types": {
    events: {} as
      { type: 'changeStartDate', 'value': string } |
      { type: 'changeReturnDate', 'value': string } |
      { type: 'book', } |
      { type: 'changeFlightType', 'value': string } |
      { type: 'closeModal', 'value': string },

    context: {} as {
      'flightType': 'one-way' | 'return',
      'startDate': { date: string, isValid: boolean },
      'returnDate': { date: string, isValid: boolean },
      'areDatesFeasible': boolean,
    }
  },
  actions: {
    "onChangeFlightType": assign({
      flightType: ({ event }) => event.value
    }),
    "onChangeStartDate": assign({
      startDate: ({ event }) => ({
        date: event.value,
        isValid: isValidDate(event.value)
      }),
      areDatesFeasible: ({ context, event }) => context.flightType !== "return" || checkIfDatesFeasible(event.value, context.returnDate.date)
    }),
    "onChangeReturnDate": assign({
      returnDate: ({ event }) => ({
        date: event.value,
        isValid: isValidDate(event.value)
      }),
      areDatesFeasible: ({ context, event }) => checkIfDatesFeasible(context.startDate.date, event.value)
    }),
  },
  guards: {
    "areDatesFeasible": ({ context }) => { return context.areDatesFeasible }
  },
}).createMachine({
  "id": "flightBooker",
  "initial": "waitForInput",
  "context": {
    flightType: 'one-way',
    startDate: {
      date: INITIAL_DATE,
      isValid: true
    },
    returnDate: {
      date: INITIAL_DATE,
      isValid: true
    },
    areDatesFeasible: true
  },
  "states": {
    "waitForInput": {
      "on": {
        "changeStartDate": {
          "actions": {
            "type": "onChangeStartDate"
          }
        },
        "changeReturnDate": {
          "actions": {
            "type": "onChangeReturnDate"
          }
        },
        "book": {
          "target": "confirmBooking",
          "guard": "areDatesFeasible"
        },
        "changeFlightType": {
          "actions": {
            "type": "onChangeFlightType"
          }
        }
      }
    },
    "confirmBooking": {
      "on": {
        "closeModal": {
          "target": "waitForInput",
        },
      }
    },
  })