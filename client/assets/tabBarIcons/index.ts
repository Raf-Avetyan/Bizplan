import HomeIcon from "./home";
import FileIcon from "./file";
import MessageIcon from "./message";
import DolarIcon from "./dolar";

export { HomeIcon, FileIcon, MessageIcon, DolarIcon };

export interface IIconProps {
  width: number;
  height: number;
  fill: string;
  selectedTab?: string;
}
