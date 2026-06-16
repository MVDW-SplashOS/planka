/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

import React, { useMemo } from "react";
import PropTypes from "prop-types";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { Icon } from "semantic-ui-react";

import selectors from "../../../selectors";
import { RecurrenceTypes } from "../../../constants/Enums";

import styles from "./RecurrenceChip.module.scss";

const LABEL_BY_TYPE = {
  [RecurrenceTypes.DAILY]: "common.daily",
  [RecurrenceTypes.WEEKLY]: "common.weekly",
  [RecurrenceTypes.MONTHLY]: "common.monthly",
  [RecurrenceTypes.YEARLY]: "common.yearly",
};

const RecurrenceChip = React.memo(({ recurrence }) => {
  const [t] = useTranslation();

  const list = useSelector((state) => {
    if (!recurrence || !recurrence.listId) {
      return null;
    }

    const selectListById = selectors.makeSelectListById();
    return selectListById(state, recurrence.listId);
  });

  const text = useMemo(() => {
    if (!recurrence) {
      return null;
    }

    const interval = recurrence.interval || 1;
    const typeLabel = t(
      LABEL_BY_TYPE[recurrence.type] || `common.${recurrence.type}`,
    );

    if (interval === 1) {
      return typeLabel;
    }

    return `Every ${interval} ${typeLabel}`;
  }, [recurrence, t]);

  if (!text) {
    return null;
  }

  return (
    <span className={styles.wrapper}>
      <Icon name="repeat" className={styles.icon} />
      <span className={styles.text}>
        {text}
        {list && (
          <span className={styles.list}>
            {" → "}
            {list.name || t(`common.${list.type}`)}
          </span>
        )}
      </span>
    </span>
  );
});

RecurrenceChip.propTypes = {
  recurrence: PropTypes.shape({
    type: PropTypes.string.isRequired,
    interval: PropTypes.number,
    listId: PropTypes.string,
  }),
};

RecurrenceChip.defaultProps = {
  recurrence: undefined,
};

export default RecurrenceChip;
