import React from 'react';

export default function UserKeyItem(props: any) {
  const {
    key
  } = props;

  if (!key.verified) {
    return (
      <div>Invalid</div>
    );
  }
  return (
    <div>
      {key.account}
    </div>
  );
}
