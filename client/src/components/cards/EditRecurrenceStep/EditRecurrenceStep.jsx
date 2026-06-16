/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

import React, { useCallback, useMemo } from "react";
import PropTypes from "prop-types";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { Button, Form, Dropdown } from "semantic-ui-react";
import { Input, Popup } from "../../../lib/custom-ui";

import selectors from "../../../selectors";
import entryActions from "../../../entry-actions";
import { RecurrenceTypes } from "../../../constants/Enums";

import styles from "./EditRecurrenceStep.module.scss";

const EditRecurrenceStep = React.memo(({ cardId, onBack, onClose }) => {
  const selectCardById = useMemo(() => selectors.makeSelectCardById(), []);

  const card = useSelector((state) => selectCardById(state, cardId));

  const availableLists = useSelector(
    selectors.selectAvailableListsForCurrentBoard,
  );

  const dispatch = useDispatch();
  const [t] = useTranslation();

  const [type, setType] = React.useState(
    card.recurrence ? card.recurrence.type : RecurrenceTypes.DAILY,
  );
  const [interval, setIntervalValue] = React.useState(
    card.recurrence ? String(card.recurrence.interval) : "1",
  );
  const [listId, setListId] = React.useState(
    card.recurrence ? card.recurrence.listId || "" : "",
  );

  const listOptions = useMemo(
    () =>
      availableLists
        ? availableLists.map((list) => ({
            key: list.id,
            value: list.id,
            text: list.name || t(`common.${list.type}`),
          }))
        : [],
    [availableLists, t],
  );

  const handleSubmit = useCallback(() => {
    const parsedInterval = parseInt(interval, 10);

    if (Number.isNaN(parsedInterval) || parsedInterval < 1) {
      return;
    }

    dispatch(
      entryActions.updateCard(cardId, {
        recurrence: {
          type,
          interval: parsedInterval,
          listId: listId || null,
        },
      }),
    );

    onClose();
  }, [cardId, onClose, dispatch, type, interval, listId]);

  const handleClearClick = useCallback(() => {
    if (card.recurrence) {
      dispatch(
        entryActions.updateCard(cardId, {
          recurrence: null,
        }),
      );
    }

    onClose();
  }, [cardId, onClose, card.recurrence, dispatch]);

  const typeOptions = useMemo(
    () => [
      {
        key: RecurrenceTypes.DAILY,
        value: RecurrenceTypes.DAILY,
        text: t("common.daily"),
      },
      {
        key: RecurrenceTypes.WEEKLY,
        value: RecurrenceTypes.WEEKLY,
        text: t("common.weekly"),
      },
      {
        key: RecurrenceTypes.MONTHLY,
        value: RecurrenceTypes.MONTHLY,
        text: t("common.monthly"),
      },
      {
        key: RecurrenceTypes.YEARLY,
        value: RecurrenceTypes.YEARLY,
        text: t("common.yearly"),
      },
    ],
    [t],
  );

  const handleTypeChange = useCallback((event, data) => {
    setType(data.value);
  }, []);

  const handleIntervalChange = useCallback((event) => {
    setIntervalValue(event.target.value);
  }, []);

  const handleListChange = useCallback((event, data) => {
    setListId(data.value);
  }, []);

  return (
    <>
      <Popup.Header onBack={onBack}>
        {t("common.editRecurrence", {
          context: "title",
        })}
      </Popup.Header>
      <Popup.Content>
        <Form onSubmit={handleSubmit}>
          <div className={styles.fieldWrapper}>
            <div className={styles.fieldBox}>
              <div className={styles.text}>{t("common.repeatEvery")}</div>
              <Input
                name="interval"
                value={interval}
                maxLength={4}
                onChange={handleIntervalChange}
              />
            </div>
            <div className={styles.fieldBox}>
              <div className={styles.text}>{t("common.period")}</div>
              <Dropdown
                selection
                options={typeOptions}
                value={type}
                onChange={handleTypeChange}
              />
            </div>
          </div>
          <div className={styles.fieldWrapper}>
            <div className={styles.fieldBox}>
              <div className={styles.text}>
                {t("common.moveToListOnRecurrence")}
              </div>
              <Dropdown
                fluid
                selection
                clearable
                options={listOptions}
                value={listId || null}
                placeholder={t("common.selectList")}
                onChange={handleListChange}
              />
            </div>
          </div>
          <Button positive content={t("action.save")} />
        </Form>
        <Button
          negative
          content={t("action.remove")}
          className={styles.deleteButton}
          onClick={handleClearClick}
        />
      </Popup.Content>
    </>
  );
});

EditRecurrenceStep.propTypes = {
  cardId: PropTypes.string.isRequired,
  onBack: PropTypes.func,
  onClose: PropTypes.func.isRequired,
};

EditRecurrenceStep.defaultProps = {
  onBack: undefined,
};

export default EditRecurrenceStep;
