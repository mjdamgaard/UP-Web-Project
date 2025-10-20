
import * as InputRange from 'InputRange.jsx';
import * as InputText from 'InputText.jsx';
import {parseFloat, isNaN} from 'number';
import {toString} from 'string';


export function render({
  min, max, value, step, size = 4, placeholder, onChange
}) {
  return (
    <div className="input-range-and-value">
      <InputRange key="r"
        min={min} max={max} value={value} step={step}
        onInput={({value}) => {
          this.call("t", "setValue", value);
          if (onChange) {
            onChange(value);
          }
        }}
        onChange={({value}) => {
          if (onChange) {
            onChange(value);
          }
        }}
      />
      <InputText key="t"
        size={size} value={value} placeholder={placeholder}
        onInput={({value}) => {
          let floatValue = parseFloat(value);
          if (toString(floatValue) !== value) return;
          this.call("r", "setValue", floatValue);
          if (onChange) {
            onChange(value);
          }
        }}
      />
    </div>
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


