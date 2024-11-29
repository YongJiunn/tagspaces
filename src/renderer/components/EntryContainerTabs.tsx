/**
 * TagSpaces - universal file and folder organizer
 * Copyright (C) 2017-present TagSpaces GmbH
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License (version 3) as
 * published by the Free Software Foundation.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 *
 */

import AppConfig from '-/AppConfig';
import {
  AIIcon,
  DescriptionIcon,
  EditDescriptionIcon,
  FolderPropertiesIcon,
  RevisionIcon,
} from '-/components/CommonIcons';
import Tooltip from '-/components/Tooltip';
import TsTabPanel from '-/components/TsTabPanel';
import { useCurrentLocationContext } from '-/hooks/useCurrentLocationContext';
import { useOpenedEntryContext } from '-/hooks/useOpenedEntryContext';
import { Pro } from '-/pro';
import { AppDispatch } from '-/reducers/app';
import {
  actions as SettingsActions,
  getEntryContainerTab,
  getMapTileServer,
  isDevMode,
} from '-/reducers/settings';
import { CommonLocation } from '-/utils/CommonLocation';
import { Box, Tab, Tabs, useMediaQuery } from '@mui/material';
import { styled, useTheme } from '@mui/material/styles';
import { getBackupFileDir } from '@tagspaces/tagspaces-common/paths';
import React, { useEffect, useReducer, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { useFilePropertiesContext } from '-/hooks/useFilePropertiesContext';
import LoadingLazy from '-/components/LoadingLazy';
import { useChatContext } from '-/hooks/useChatContext';

interface StyledTabsProps {
  children?: React.ReactNode;
  value: number;
  onChange: (event: React.SyntheticEvent, newValue: number) => void;
}

type TabItem = {
  dataTid: string;
  icon: React.ReactNode;
  title: string;
  name: string;
};

const StyledTabs = styled((props: StyledTabsProps) => (
  <Tabs
    {...props}
    variant="scrollable"
    // scrollButtons={}
    // allowScrollButtonsMobile
    TabIndicatorProps={{ children: <span className="MuiTabs-indicatorSpan" /> }}
  />
))(({ theme }) => ({
  '& .MuiTabs-indicator': {
    display: 'flex',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  '& .MuiTabs-indicatorSpan': {
    maxWidth: 40,
    width: '100%',
    backgroundColor: theme.palette.text.primary, //theme.palette.background.default //'#635ee7',
  },
}));

interface StyledTabProps {
  title: string;
  tinyMode: any;
  icon: any;
  onClick: (event: React.SyntheticEvent) => void;
}

const StyledTab = styled((props: StyledTabProps) => {
  const { title, tinyMode, ...tabProps } = props; // Extract title and tinyMode

  return (
    <Tooltip title={!tinyMode && title}>
      <Tab
        label={!tinyMode && title}
        disableRipple
        iconPosition="start"
        {...tabProps} // Pass remaining props to Tab
      />
    </Tooltip>
  );
})(({ theme }) => ({
  textTransform: 'none',
  fontWeight: theme.typography.fontWeightRegular,
  fontSize: theme.typography.pxToRem(15),
  minHeight: 50,
  maxHeight: 50,
  minWidth: 40,
  marginRight: 5,
  padding: 5,
}));

function a11yProps(index: number) {
  return {
    id: `tab-${index}`,
    'aria-controls': `simple-tabpanel-${index}`,
  };
}

const TabContent1 = React.lazy(
  () => import(/* webpackChunkName: "EntryProperties" */ './EntryProperties'),
);

const TabContent2 = React.lazy(
  () => import(/* webpackChunkName: "EditDescription" */ './EditDescription'),
);
const TabContent3 = React.lazy(
  () => import(/* webpackChunkName: "Revisions" */ './Revisions'),
);
const TabContent4 = React.lazy(
  () => import(/* webpackChunkName: "AiPropertiesTab" */ './AiPropertiesTab'),
);

interface EntryContainerTabsProps {
  openPanel: () => void;
  toggleProperties: () => void;
  isEditable: boolean;
  isPanelOpened: boolean;
  haveDescription: boolean;
  marginRight: string;
}

function EntryContainerTabs(props: EntryContainerTabsProps) {
  const {
    openPanel,
    toggleProperties,
    marginRight,
    isEditable,
    isPanelOpened,
    haveDescription,
  } = props;

  const { t } = useTranslation();
  const { findLocation } = useCurrentLocationContext();
  const { initHistory } = useChatContext();
  const { openedEntry } = useOpenedEntryContext();
  const { isEditMode } = useFilePropertiesContext();
  const theme = useTheme();
  const devMode: boolean = useSelector(isDevMode);
  const tabIndex = useSelector(getEntryContainerTab);
  const tileServer = useSelector(getMapTileServer);
  const haveRevisions = useRef<boolean>(isEditable);
  //const selectedTabIndex = useRef<number>(initSelectedTabIndex(tabIndex));
  const dispatch: AppDispatch = useDispatch();
  const [ignored, forceUpdate] = useReducer((x) => x + 1, 0, undefined);
  const isTinyMode = useMediaQuery(theme.breakpoints.down('sm'));

  /* useEffect(() => {
    selectedTabIndex.current = tabIndex;
    forceUpdate();
  }, [tabIndex]);*/

  useEffect(() => {
    //selectedTabIndex.current = initSelectedTabIndex(tabIndex);
    if (isEditable) {
      const location: CommonLocation = findLocation(openedEntry.locationID);
      const backupFilePath = getBackupFileDir(
        openedEntry.path,
        openedEntry.uuid,
        location?.getDirSeparator(),
      );
      location?.checkDirExist(backupFilePath).then((exist) => {
        haveRevisions.current = exist;
        forceUpdate();
      });
    } else if (haveRevisions.current) {
      haveRevisions.current = false;
      forceUpdate();
    }
  }, [isEditable, isEditMode]);

  /*function initSelectedTabIndex(index) {
    if (!haveRevisions.current) {
      if (index === 2) {
        return 0;
      } else if (index === 3) {
        return 2;
      }
    }
    // directories must be always opened
    return !openedEntry.isFile && index === undefined ? 0 : index;
  }*/

  const tab1: TabItem = {
    dataTid: 'detailsTabTID',
    icon: <FolderPropertiesIcon />,
    title: t('core:details'),
    name: 'propertiesTab',
  };
  const tab2: TabItem = {
    dataTid: 'descriptionTabTID',
    icon: haveDescription ? <EditDescriptionIcon /> : <DescriptionIcon />,
    title: t('core:filePropertiesDescription'),
    name: 'descriptionTab',
  };

  const tabsArray: TabItem[] = [tab1, tab2];
  if (haveRevisions.current) {
    const tab3: TabItem = {
      dataTid: 'revisionsTabTID',
      icon: <RevisionIcon />,
      title: t('core:revisions'),
      name: 'revisionsTab',
    };
    tabsArray.push(tab3);
  }

  if (!openedEntry.isFile || (devMode && Pro && AppConfig.isElectron)) {
    if (AppConfig.isElectron) {
      // todo enable for web
      const tab4: TabItem = {
        dataTid: 'aiTabTID',
        icon: <AIIcon />,
        title: t('core:aiSettingsTab'),
        name: 'aiTab',
      };
      tabsArray.push(tab4);
    }
  }

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    const tab = tabsArray[newValue];
    if (tab && tab.name === 'aiTab') {
      initHistory();
    }
    dispatch(SettingsActions.setEntryContainerTab(newValue));
    openPanel();
    console.log('tab changed to:' + newValue);
  };
  function handleTabClick(selectedTabIndex, index: number) {
    if (
      openedEntry.isFile &&
      selectedTabIndex === index //parseInt(event.currentTarget.id.split('-')[1], 10)
    ) {
      // when selected tab is clicked...
      dispatch(SettingsActions.setEntryContainerTab(undefined));
      toggleProperties();
      console.log('tab click:' + index);
    }
  }

  function getSelectedTabIndex(maxTabsIndex) {
    if (!isPanelOpened) {
      return undefined;
    }
    if (!tabIndex) {
      return 0;
    }
    if (tabIndex > maxTabsIndex) {
      return maxTabsIndex;
    }
    return tabIndex;
  }

  const selectedTabIndex = getSelectedTabIndex(tabsArray.length - 1);

  function getTabContainer(tabName: string) {
    if (tabName === 'propertiesTab') {
      return <TabContent1 key={openedEntry.path} tileServer={tileServer} />;
    } else if (tabName === 'descriptionTab') {
      return <TabContent2 />;
    } else if (tabName === 'revisionsTab') {
      return <TabContent3 />;
    } else if (tabName === 'aiTab') {
      return <TabContent4 />;
    }
  }

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        borderBottom:
          openedEntry.isFile && !isPanelOpened
            ? '1px solid ' + theme.palette.divider
            : 'none',
      }}
    >
      <Box sx={{ ...(marginRight && { marginRight }) }}>
        <StyledTabs
          value={selectedTabIndex}
          onChange={handleChange}
          aria-label="Switching among description, revisions entry properties"
        >
          {tabsArray.map((tab, index) => (
            <StyledTab
              data-tid={tab.dataTid}
              icon={tab.icon}
              title={tab.title}
              tinyMode={isTinyMode}
              {...a11yProps(index)}
              onClick={() => handleTabClick(selectedTabIndex, index)}
            />
          ))}
        </StyledTabs>
      </Box>
      <React.Suspense fallback={<LoadingLazy />}>
        {tabsArray.map((tab, index) => (
          <TsTabPanel key={tab.name} value={selectedTabIndex} index={index}>
            {getTabContainer(tab.name)}
          </TsTabPanel>
        ))}
      </React.Suspense>
    </div>
  );
}

export default EntryContainerTabs;
