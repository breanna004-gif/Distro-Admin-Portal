export type ModuleStatus =
  | 'PLANNED'
  | 'IN_PROGRESS'
  | 'CONNECTED'
  | 'TESTED';

export interface SystemModule {
  key: string;
  name: string;
  status: ModuleStatus;

  frontend: boolean;
  backend: boolean;

  route?: string;
  endpoint?: string;

  dependsOn: string[];
  usedBy: string[];
}
