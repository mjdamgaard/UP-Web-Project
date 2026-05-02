
import * as InputRange from 'InputRange.jsx';
import * as InputText from 'InputText.jsx';
import {parseFloat} from 'number';
import {toString} from 'string';


export function render({
  min, max, value, step, size = 4, placeholder, onChange, onInput,
}) {
  return (
    <span className="input-range-and-value">
      <InputRange key="r"
        min={min} max={max} value={value} step={step}
        onInput={e => {
          let {value} = e;
          this.call("t", "setValue", value);
          if (onInput) {
            onInput(e);
          }
        }}
        onChange={onChange ? e => onChange(e) : undefined}
      />
      <InputText key="t"
        size={size} value={value} placeholder={placeholder}
        onInput={e => {
          let {value} = e;
          let floatValue = parseFloat(value);
          if (toString(floatValue) !== value) return;
          this.call("r", "setValue", floatValue);
          if (onInput) {
            onInput(e);
          }
        }}
        onChange={onChange ? e => onChange(e) : undefined}
      />
    </span>
  );
}


export const actions = {
  "getValue": function() {
    return parseFloat(this.call("t", "getValue"));
  },
  "setValue": function(val) {
    this.call("r", "setValue", val);
    return this.call("t", "setValue", val);
  }
};

export const methods = [
  "getValue",
  "setValue",
];


