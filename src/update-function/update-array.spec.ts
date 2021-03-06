import { createFormArrayState } from '../state';
import { FORM_CONTROL_ID } from './test-util';
import { updateArray } from './update-array';

describe(updateArray.name, () => {
  it('should apply the provided functions to control children', () => {
    const state = createFormArrayState(FORM_CONTROL_ID, ['']);
    const expected = { ...state.controls[0], value: 'A' };
    const resultState = updateArray<typeof expected.value>(() => expected)(state);
    expect(resultState.controls[0]).toBe(expected);
  });

  it('should apply the provided functions to all control children', () => {
    const state = createFormArrayState(FORM_CONTROL_ID, ['', '']);
    const expected = { ...state.controls[0], value: 'A' };
    const resultState = updateArray<typeof expected.value>(() => expected)(state);
    expect(resultState.controls[0]).toBe(expected);
    expect(resultState.controls[1]).toBe(expected);
  });

  it('should apply the provided functions to group children', () => {
    const state = createFormArrayState(FORM_CONTROL_ID, [{ inner: '' }]);
    const expected = { ...state.controls[0], value: { inner: 'A' } };
    const resultState = updateArray<typeof expected.value>(() => expected)(state);
    expect(resultState.controls[0]).toBe(expected);
  });

  it('should apply the provided functions to array children', () => {
    const state = createFormArrayState(FORM_CONTROL_ID, [['']]);
    const expected = { ...state.controls[0], value: ['A'] };
    const resultState = updateArray<typeof expected.value>(() => expected)(state);
    expect(resultState.controls[0]).toBe(expected);
  });

  it('should apply the provided functions to control children uncurried', () => {
    const state = createFormArrayState(FORM_CONTROL_ID, ['']);
    const expected = { ...state.controls[0], value: 'A' };
    const resultState = updateArray<typeof expected.value>(state, () => expected);
    expect(resultState.controls[0]).toBe(expected);
  });

  it('should apply the provided functions to all control children uncurried', () => {
    const state = createFormArrayState(FORM_CONTROL_ID, ['', '']);
    const expected = { ...state.controls[0], value: 'A' };
    const resultState = updateArray<typeof expected.value>(state, () => expected);
    expect(resultState.controls[0]).toBe(expected);
    expect(resultState.controls[1]).toBe(expected);
  });

  it('should apply the provided functions to group children uncurried', () => {
    const state = createFormArrayState(FORM_CONTROL_ID, [{ inner: '' }]);
    const expected = { ...state.controls[0], value: { inner: 'A' } };
    const resultState = updateArray<typeof expected.value>(state, () => expected);
    expect(resultState.controls[0]).toBe(expected);
  });

  it('should apply the provided functions to array children uncurried', () => {
    const state = createFormArrayState(FORM_CONTROL_ID, [['']]);
    const expected = { ...state.controls[0], value: ['A'] };
    const resultState = updateArray<typeof expected.value>(state, () => expected);
    expect(resultState.controls[0]).toBe(expected);
  });

  it('should apply multiple provided functions one after another', () => {
    const state = createFormArrayState(FORM_CONTROL_ID, ['A', 'B', 'C']);
    const expected1 = { ...state.controls[0], value: 'D' };
    const expected2 = { ...state.controls[1], value: 'E' };
    const expected3 = { ...state.controls[2], value: 'F' };
    let resultState = updateArray<typeof expected1.value>(s => s.value === 'A' ? expected1 : s.value === 'B' ? expected3 : s)(state);
    resultState = updateArray<typeof expected1.value>(s => s.value === 'F' ? expected2 : s.value === 'C' ? expected3 : s)(resultState);
    expect(resultState.controls[0]).toBe(expected1);
    expect(resultState.controls[1]).toBe(expected2);
    expect(resultState.controls[2]).toBe(expected3);
  });

  it('should pass the parent array as the second parameter', () => {
    const state = createFormArrayState(FORM_CONTROL_ID, ['', '']);
    updateArray<typeof state.value[0]>((c, p) => {
      expect(p).toBe(state);
      return c;
    })(state);
  });
});
