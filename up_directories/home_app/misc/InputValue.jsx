
import * as InputText from 'InputText.jsx';
import {parseFloat} from 'number';
import {toString} from 'string';


export function render({
  min, max, value, step, size = 4, placeholder, onChange
}) {
  return (
    <div className="input-value">
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
    return this.call("t", "setValue", val);
  }
};

export const methods = [
  "getValue",
  "setValue",
];


