<script setup lang="ts">
import { useMachine } from '@xstate/vue'
import { flightMachine } from './flightMachine';
import { createBrowserInspector } from '@statelyai/inspect';

const { inspect } = createBrowserInspector({
  // Comment out the line below to start the inspector
  autoStart: false
});

const { snapshot, send } = useMachine(flightMachine, {
  inspect
})
</script>

<template>
  <div class="center-children">
    <label for="pet-select">Flight Type</label>
    <select @change="(event) => send({ type: 'changeFlightType', value: (event!.target as HTMLInputElement)!.value })"
      name="pets" id="pet-select" size="2">
      <option :selected="snapshot.context.flightType === 'one-way'" value="one-way">One-Way</option>
      <option :selected="snapshot.context.flightType === 'return'" value="return">Return</option>
    </select>
  </div>
  <div class="center-children">
    <label for="start-date">Start Date</label>
    <input :class="{ invalidDateInput: !snapshot.context.startDate.isValid }"
      @input="(event) => send({ type: 'changeStartDate', value: (event!.target as HTMLInputElement)!.value })"
      :value="snapshot.context.startDate.date" type="text" id="start-date" required minlength="6" maxlength="10"
      size="10" />
  </div>
  <div class="center-children">
    <label for="return-date">Return Date</label>
    <input :disabled="snapshot.context.flightType === 'one-way'"
      :class="{ invalidDateInput: !snapshot.context.returnDate.isValid }"
      @input="(event) => send({ type: 'changeReturnDate', value: (event!.target as HTMLInputElement)!.value })"
      :value="snapshot.context.returnDate.date" type="text" id="return-date" required minlength="6" maxlength="10"
      size="10" />
  </div>
  <button :disabled="!snapshot.context.canBook" @click="send({ type: 'book' })"> Book flight!
  </button>
</template>