import type { ReactNode } from 'react';
export const inputClasses='border rounded-lg px-2 py-1 text-sm w-full';
export const filterInputClasses=inputClasses;
export const modalClasses='bg-white rounded-2xl p-4 w-full max-w-4xl max-h-[95dvh] overflow-y-auto relative z-10';
export const FullWidthField=({label,children,className=''}:{label:string;children:ReactNode;className?:string})=><label className={`flex flex-col ${className}`}>{label}{children}</label>;
export const canUserAccessProject=(p:any,id:string)=>!p.assignedWorkerIds?.length || p.assignedWorkerIds.includes(id);
