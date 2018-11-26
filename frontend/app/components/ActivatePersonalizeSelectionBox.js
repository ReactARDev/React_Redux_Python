import React from 'react';

const registerSelectionBox = (
  mode,
  text,
  name,
  isChecked,
  handleClick,
  title,
  extraClasses,
  state = false
) => {
  let classes = 'well ';

  if (extraClasses) {
    classes += extraClasses + ' ';
  }
  let icon = 'add_circle_outline';

  if (isChecked) {
    icon = 'done';
    classes += 'selected';
  }

  return (
    <div
      className={classes}
      key={name}
      title={title}
      data-name={name}
      data-mode={mode}
      data-state={state}
      onClick={handleClick}
    >
      <label>
        {text}
        <input type="checkbox" mode={mode} value={name} checked={isChecked} readOnly />
      </label>
      <i className="material-icons">
        {icon}
      </i>
    </div>
  );
};

export default registerSelectionBox;
