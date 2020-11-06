import React, { useState } from 'react';
import PropTypes from 'prop-types';
import axios from 'axios';
import { map, compact, trim } from 'lodash';
import { useForm, Controller } from 'react-hook-form';
import { WORD_SUGGESTIONS_API_URL } from '../config';
import AddIcon from '../assets/icons/add.svg';
import DeleteIcon from '../assets/icons/delete.svg';

const inputStyles = 'h-10 w-full border-current border-solid border border-gray-600 rounded-md px-3 py-5';
const listContainerStyles = 'flex items-center mb-10';
const submitButtonStyles = 'h-10 mt-5 lg:h-10 w-full lg:w-32 bg-green-600 rounded text-gray-100';
const cancelButtonStyles = 'h-10 mt-5 lg:h-10 lg:w-32 text-gray-600';
const formHeader = 'text-xl mb-2 mt-5';
const errorStyles = 'text-red-500 mt-3';

const AddWord = ({
  onRequestClose,
  onSuccess,
  onFailure,
  defaultValues,
}) => {
  const {
    handleSubmit,
    getValues,
    reset,
    control,
    errors,
  } = useForm();
  const [definitions, setDefinitions] = useState(defaultValues?.definitions || ['']);
  const [variations, setVariations] = useState(defaultValues?.variations || ['']);

  const onSubmit = (data) => {
    const cleanedData = {
      ...data,
      definitions: compact(map(data.definitions, (definition) => trim(definition))),
      variations: compact(map(data.variations, (variation) => trim(variation))),
      originalWordId: defaultValues?.id || null,
    };
    axios
      .post(WORD_SUGGESTIONS_API_URL, cleanedData)
      .then(() => {
        reset();
        onSuccess({ subtitle: 'You\'re word edit has been sent for review by editors.' });
      })
      .catch(() => {
        onFailure({ subtitle: 'Double check you have entered all required information.' });
      });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <p className="mt-2">
        {`By either suggesting a new word or editing an existing one, 
        you are helping in advancing learning materials for the Igbo language.`}
      </p>
      <p className="mt-2">
        {`Please provide words with their correct part speech, 
        meaningful definitions, and helpful word variations.`}
      </p>
      {defaultValues?.id ? (
        <p className="mt-4 font-bold">
          <span role="img" aria-label="Exclamation point">❗️</span>
          The form is pre-filled because you are editing an existing word. Add new or change existing data.
        </p>
      ) : null}
      <h2 className={formHeader}>Word</h2>
      <Controller
        as={<input className={`${inputStyles}`} placeholder="i.e. biko, igwe, mmiri" data-test="new-word-input" />}
        name="word"
        control={control}
        defaultValue={defaultValues?.word || getValues().word}
        rules={{
          required: true,
        }}
      />
      {errors.word && (
        <span className={errorStyles}>Word is required</span>
      )}
      <h2 className={formHeader}>Part of speech</h2>
      <Controller
        as={<input className={inputStyles} placeholder="i.e. noun, verb" data-test="word-class-input" />}
        name="wordClass"
        control={control}
        defaultValue={defaultValues?.wordClass || getValues().wordClass}
        rules={{
          required: true,
        }}
      />
      {errors.wordClass && (
        <span className={errorStyles}>Part of speech is required</span>
      )}
      <div className="flex items-center my-5 w-full justify-between">
        <h2 className="text-xl">Definitions</h2>
        <button
          type="button"
          aria-label="Add Definition"
          onClick={() => {
            const updateDefinitions = [...definitions];
            updateDefinitions.push('');
            setDefinitions(updateDefinitions);
          }}
        >
          <AddIcon />
        </button>
      </div>
      {definitions.map((definition, index) => (
        <>
          <div className={listContainerStyles}>
            <h3 className="text-xl text-gray-600 mr-2">
              {`${index + 1}.`}
            </h3>
            <Controller
              as={(
                <input
                  className={inputStyles}
                  size="large"
                  placeholder="Definition"
                  defaultValue={definition}
                  data-test={`definitions-${index}-input`}
                />
              )}
              name={`definitions[${index}]`}
              defaultValue={definition}
              control={control}
              rules={{
                required: !index,
              }}
            />
            {index ? (
              <button
                type="button"
                aria-label="Delete Definition"
                className="ml-2"
                onClick={() => {
                  const updateDefinitions = [...definitions];
                  updateDefinitions.splice(index, 1);
                  setDefinitions(updateDefinitions);
                }}
              >
                <DeleteIcon />
              </button>
            ) : null }
          </div>
          {!index && errors.definitions && (
            <span className={`${errorStyles} definitionError relative`}>Definition is required</span>
          )}
        </>
      ))}
      <div className="flex items-center my-5 w-full justify-between">
        <h2 className="text-xl">Variations</h2>
        <button
          type="button"
          aria-label="Add Variation"
          onClick={() => {
            const updateVariations = [...variations];
            updateVariations.push('');
            setVariations(updateVariations);
          }}
        >
          <AddIcon />
        </button>
      </div>
      {variations.length ? variations.map((variation, index) => (
        <div className={listContainerStyles}>
          <Controller
            as={(
              <input
                className={`${inputStyles}`}
                size="large"
                placeholder="Variation"
                defaultValue={variation}
                data-test={`variations-${index}-input`}
              />
            )}
            name={`variations[${index}]`}
            defaultValue={variation}
            control={control}
          />
          <button
            type="button"
            aria-label="Delete Variation"
            className="ml-2"
            onClick={() => {
              const updateVariations = [...variations];
              updateVariations.splice(index, 1);
              setVariations(updateVariations);
            }}
          >
            <DeleteIcon />
          </button>
        </div>
      )) : (
        <div className="flex w-full justify-center">
          <p className="text-gray-600">No variations</p>
        </div>
      )}
      <div className="flex flex-col lg:flex-row-reverse lg:justify-start">
        <button type="submit" className={submitButtonStyles}>Submit</button>
        <button
          type="button"
          className={cancelButtonStyles}
          onClick={() => {
            reset();
            onRequestClose();
          }}
        >
          Cancel
        </button>
      </div>
    </form>
  );
};

AddWord.propTypes = {
  onRequestClose: PropTypes.func.isRequired,
  onSuccess: PropTypes.func,
  onFailure: PropTypes.func,
  defaultValues: PropTypes.objectOf(['word']),
};

AddWord.defaultProps = {
  onSuccess: () => {},
  onFailure: () => {},
  defaultValues: {},
};

export default AddWord;