import { errorMessages } from 'vue/compiler-sfc';
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
const isReadyToBook = (flightType: string, startDate: string, returnDate: string) => {
  if (flightType === "one-way") {
    return isValidDate(startDate)
  }
  return isValidDate(startDate) && isValidDate(returnDate) && areDatesFeasible(startDate, returnDate)
}
type FormError = 'start-date-invalid' | 'return-date-invalid' | 'dates-incompatible';

const mapEventsToErrors = {
  'changeStartDate': 'start-date-invalid',
  'changeReturnDate': 'return-date-invalid',
}

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
      'startDate': { date: string, isValid: boolean },
      'returnDate': { date: string, isValid: boolean },
      'errors': Set<FormError>,
      'canBook': boolean,
    }
    // snapshot.context.flightType === 'return' && !snapshot.context.areDatesFeasible || !snapshot.context.startDate.isValid
  },
  actions: {
    handleConstraints: ({ context, event }) => {
      if (isValidDate(event.value)) {
        context.errors.delete(mapEventsToErrors[event.type])
      } else { context.errors.add.mapEventsToErrors[event.type] }

      if (areDatesFeasible(context.startDate.date, context.returnDate.date)) {
        context.errors.delete('dates-incompatible');
      } else { context.errors.add('dates-incompatible') }
    },
    "onChangeFlightType": assign({
      flightType: ({ event }) => event.value,
      canBook: ({ context, event }) => isReadyToBook(event.value, context.startDate.date, context.returnDate.date)
    }),
    "onChangeStartDate": assign({
      errors: ({ event, context }) => (isValidDate(event.value) ? context.errors.delete('start-date-invalid') : context.errors.add('start-date-invalid')),
      startDate: ({ event, context }) => ({
        date: event.value,
        isValid: isValidDate(event.value)
      }),
      canBook: ({ context, event }) => isReadyToBook(context.flightType, event.value, context.returnDate.date)
    }),
    "onChangeReturnDate": assign({
      returnDate: ({ event }) => ({
        date: event.value,
        isValid: isValidDate(event.value)
      }),
      canBook: ({ context, event }) => isReadyToBook(context.flightType, context.startDate.date, event.value)
    }),
  },
  guards: {
    "canBook": ({ context }) => { return context.canBook }
  },
}).createMachine({
  "id": "flightBooker",
  "initial": "waitForInput",
  "context": {
    errors: new Set([]),
    flightType: 'one-way',
    startDate: {
      date: INITIAL_DATE,
      isValid: true
    },
    returnDate: {
      date: INITIAL_DATE,
      isValid: true
    },
    canBook: true
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
          "guard": "canBook"
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
  }
})