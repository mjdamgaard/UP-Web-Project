
import * as InputRange from 'InputRange.jsx';
import * as InputText from 'InputText.jsx';
import {parseFloat, isNaN} from 'number';


export function render({min, max, value, step, size = 4, onChange}) {
  return (
    <div className="input-range-and-value">
      <InputRange key="r"
        min={min} max={max} value={value} step={step} onChange={val => {
          this.call("t", "setValue", val);
          onChange(val);
        }}
      />
      <InputText key="t"
        size={size} value={value} onChange={val => {
          val = parseFloat(val);
          if (isNaN(val)) return;
          this.call("r", "setValue", val);
          onChange(val);
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


