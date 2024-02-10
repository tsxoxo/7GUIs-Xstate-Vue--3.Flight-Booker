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
    handleConstraints: ({ context, event }) => {
      if (event.type === 'changeStartDate' || event.type === 'changeReturnDate') {
        if (isValidDate(event.value)) {
          context.errors.delete(`${event.type}-invalid`)
        } else {
          context.errors.add(`${event.type}-invalid`);
          context.errors.delete('dates-incompatible');
        }
      }

      // error gets added only if dates are also properly formatted
      if (context.flightType === 'return' && !context.errors.has('changeStartDate-invalid') && !context.errors.has('changeReturnDate-invalid')) {
        if (areDatesFeasible(context.startDate, context.returnDate)) {
          context.errors.delete('dates-incompatible');
        } else { context.errors.add('dates-incompatible') }
      }
    },

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