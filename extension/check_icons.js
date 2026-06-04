import * as bs from 'react-icons/bs';

const names = [
  'BsPerson', 'BsBoxArrowRight', 'BsSearch', 'BsRobot', 'BsCheckCircle',
  'BsLightningCharge', 'BsPencil', 'BsExclamationTriangle', 'BsFileEarmarkText',
  'BsStars', 'BsCloudUpload', 'BsEnvelope', 'BsTelephone', 'BsLink45Deg',
  'BsTextLeft', 'BsChevronDown', 'BsCheck', 'BsExclamationCircle', 'BsInfoCircle',
  'BsPersonPlus', 'BsMortarboard', 'BsBriefcase'
];

const missing = names.filter(n => !bs[n]);
console.log('Missing:', missing);
