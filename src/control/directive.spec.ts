import 'rxjs/add/operator/count';
import 'rxjs/add/operator/first';
import 'rxjs/add/operator/skip';

import { ElementRef } from '@angular/core';
import { Action } from '@ngrx/store';
import { Observable } from 'rxjs/Observable';
import { ReplaySubject } from 'rxjs/ReplaySubject';

import { MarkAsDirtyAction, SetValueAction } from '../actions';
import { createFormControlState } from '../state';
import { FormViewAdapter } from '../view-adapter/view-adapter';
import { NgrxFormControlDirective } from './directive';
import { NgrxValueConverters } from './value-converter';

describe(NgrxFormControlDirective.name, () => {
  let directive: NgrxFormControlDirective<string | null, any>;
  let elementRef: ElementRef;
  let document: Document;
  let actionsSubject: ReplaySubject<Action>;
  let actions$: Observable<Action>;
  let viewAdapter: FormViewAdapter;
  let onChange: (value: any) => void;
  let onTouched: () => void;
  const FORM_CONTROL_ID = 'test ID';
  const INITIAL_FORM_CONTROL_VALUE = 'value';
  const INITIAL_STATE = createFormControlState<string>(FORM_CONTROL_ID, INITIAL_FORM_CONTROL_VALUE);

  beforeEach(() => {
    elementRef = { nativeElement: { focus: () => void 0, blur: () => void 0 } } as any as ElementRef;
    document = {} as any as Document;
    actionsSubject = new ReplaySubject<Action>();
    actions$ = actionsSubject as any; // required due to mismatch of lift() function signature
    viewAdapter = {
      setViewValue: () => void 0,
      setOnChangeCallback: fn => onChange = fn,
      setOnTouchedCallback: fn => onTouched = fn,
      setIsDisabled: () => void 0,
    };
    directive = new NgrxFormControlDirective<string>(elementRef, document, actionsSubject as any, [viewAdapter], []);
    directive.ngrxFormControlState = INITIAL_STATE;
    directive.ngOnInit();
  });

  it('should write the value when the state changes', () => {
    const newValue = 'new value';
    const spy = spyOn(viewAdapter, 'setViewValue');
    directive.ngrxFormControlState = { ...INITIAL_STATE, value: newValue };
    expect(spy).toHaveBeenCalledWith(newValue);
  });

  it('should not write the value when the state value does not change', () => {
    const spy = spyOn(viewAdapter, 'setViewValue');
    directive.ngrxFormControlState = INITIAL_STATE;
    expect(spy).not.toHaveBeenCalled();
  });

  it('should not write the value when the state value is the same as the view value', () => {
    const newValue = 'new value';
    onChange(newValue);
    const spy = spyOn(viewAdapter, 'setViewValue');
    directive.ngrxFormControlState = { ...INITIAL_STATE, value: newValue };
    expect(spy).not.toHaveBeenCalled();
  });

  it('should write the value when the state value does not change but the id does', () => {
    const spy = spyOn(viewAdapter, 'setViewValue');
    directive.ngrxFormControlState = { ...INITIAL_STATE, id: FORM_CONTROL_ID + '1' };
    expect(spy).toHaveBeenCalledWith(INITIAL_STATE.value);
  });

  it('should write the value when the state value does not change but the id does after a new view value was reported', () => {
    const newValue = 'new value';
    onChange(newValue);
    const spy = spyOn(viewAdapter, 'setViewValue');
    directive.ngrxFormControlState = { ...INITIAL_STATE, id: FORM_CONTROL_ID + '1', value: newValue };
    expect(spy).toHaveBeenCalledWith(newValue);
  });

  it('should write the value when the state value does not change but the id does after an undefined view value was reported', () => {
    const newValue = undefined as any;
    onChange(newValue);
    const spy = spyOn(viewAdapter, 'setViewValue');
    directive.ngrxFormControlState = { ...INITIAL_STATE, id: FORM_CONTROL_ID + '1', value: newValue };
    expect(spy).toHaveBeenCalledWith(newValue);
  });

  it(`should dispatch a ${SetValueAction.name} if the view value changes`, done => {
    actions$.first().subscribe(a => {
      expect(a).toEqual(new SetValueAction(INITIAL_STATE.id, newValue));
      done();
    });

    const newValue = 'new value';
    onChange(newValue);
  });

  it(`should not dispatch a ${SetValueAction.name} if the view value is the same as the state`, done => {
    actions$.count().subscribe(c => {
      expect(c).toEqual(0);
      done();
    });

    onChange(INITIAL_STATE.value);
    actionsSubject.complete();
  });

  it(`should dispatch a ${MarkAsDirtyAction.name} if the view value changes when the state is not marked as dirty`, done => {
    actions$.skip(1).first().subscribe(a => {
      expect(a).toEqual(new MarkAsDirtyAction(INITIAL_STATE.id));
      done();
    });

    const newValue = 'new value';
    onChange(newValue);
  });

  it(`should not dispatch a ${MarkAsDirtyAction.name} if the view value changes when the state is marked as dirty`, done => {
    actions$.count().subscribe(c => {
      expect(c).toEqual(1);
      done();
    });

    directive.ngrxFormControlState = { ...INITIAL_STATE, isDirty: true, isPristine: false };
    const newValue = 'new value';
    onChange(newValue);
    actionsSubject.complete();
  });

  it('should write the value when the state changes to the same value that was reported from the view before', () => {
    const newValue = 'new value';
    onChange(newValue);
    directive.ngrxFormControlState = { ...INITIAL_STATE, value: newValue };
    directive.ngrxFormControlState = INITIAL_STATE;
    const spy = spyOn(viewAdapter, 'setViewValue');
    directive.ngrxFormControlState = { ...INITIAL_STATE, value: newValue };
    expect(spy).toHaveBeenCalledWith(newValue);
  });

  it('should correctly set the initial values if a value converter is set after the initial state', () => {
    const convertedValue = ['A'];
    viewAdapter = {
      ...viewAdapter,
      setViewValue: v => expect(v).toEqual(convertedValue),
    };
    directive = new NgrxFormControlDirective<string>(elementRef, document, actionsSubject as any, [viewAdapter], []);
    directive.ngrxFormControlState = INITIAL_STATE;
    directive.ngrxValueConverter = {
      convertStateToViewValue: () => convertedValue,
      convertViewToStateValue: s => s,
    };
    directive.ngOnInit();
  });

  describe('ngrxUpdateOn "blur"', () => {
    beforeEach(() => {
      directive.ngrxFormControlState = { ...INITIAL_STATE, isTouched: true, isUntouched: false };
      directive.ngrxUpdateOn = 'blur';
    });

    it('should dispatch an action on blur if the view value has changed with ngrxUpdateOn "blur"', done => {
      actions$.first().subscribe(a => {
        expect(a).toEqual(new SetValueAction(INITIAL_STATE.id, newValue));
        done();
      });

      const newValue = 'new value';
      onChange(newValue);
      onTouched();
    });

    it('should not dispatch an action on blur if the view value has not changed with ngrxUpdateOn "blur"', done => {
      actions$.count().subscribe(c => {
        expect(c).toEqual(0);
        done();
      });

      onTouched();
      actionsSubject.complete();
    });

    it('should not dispatch an action if the view value changes with ngrxUpdateOn "blur"', done => {
      actions$.count().subscribe(c => {
        expect(c).toEqual(0);
        done();
      });

      const newValue = 'new value';
      onChange(newValue);
      actionsSubject.complete();
    });

    it('should not write the value when the state value does not change', () => {
      const newValue = 'new value';
      onChange(newValue);
      const spy = spyOn(viewAdapter, 'setViewValue');
      directive.ngrxFormControlState = { ...INITIAL_STATE };
      expect(spy).not.toHaveBeenCalled();
    });
  });

  describe('value conversion', () => {
    const VIEW_VALUE = new Date(0);
    const STATE_VALUE = '1970-01-01T00:00:00.000Z';

    beforeEach(() => {
      directive.ngrxValueConverter = NgrxValueConverters.dateToISOString;
    });

    it('should convert the state value when the state changes', () => {
      const spy = spyOn(viewAdapter, 'setViewValue');
      directive.ngrxFormControlState = { ...INITIAL_STATE, value: STATE_VALUE };
      expect(spy).toHaveBeenCalledWith(VIEW_VALUE);
    });

    it('should convert the view value if it changes', done => {
      actions$.first().subscribe(a => {
        expect(a).toEqual(new SetValueAction(INITIAL_STATE.id, STATE_VALUE));
        done();
      });

      onChange(VIEW_VALUE);
    });

    it('should not write the value when the state value does not change with conversion', () => {
      directive.ngrxFormControlState = { ...INITIAL_STATE, value: STATE_VALUE };
      const spy = spyOn(viewAdapter, 'setViewValue');
      directive.ngrxFormControlState = { ...INITIAL_STATE, value: STATE_VALUE };
      expect(spy).not.toHaveBeenCalled();
    });

    it('should not dispatch an action if the view value is the same as the state with conversion', done => {
      actions$.count().subscribe(c => {
        expect(c).toEqual(0);
        done();
      });

      directive.ngrxFormControlState = { ...INITIAL_STATE, value: STATE_VALUE };
      onChange(VIEW_VALUE);
      actionsSubject.complete();
    });
  });

  // TODO: throwing error on undefined state
  // TODO: value conversion
  // TODO: mark as touched
  // TODO: disabling and enabling
  // TODO: focus tracking
  // TODO: last keydown code tracking
});
