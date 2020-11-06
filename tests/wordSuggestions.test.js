import chai from 'chai';
import {
  forEach,
  forIn,
  isEqual,
} from 'lodash';
import {
  deleteWordSuggestion,
  suggestNewWord,
  updateWordSuggestion,
  getWordSuggestions,
  getWordSuggestion,
} from './shared/commands';
import {
  wordSuggestionId,
  wordSuggestionData,
  wordSuggestionApprovedData,
  malformedWordSuggestionData,
  updatedWordSuggestionData,
} from './__mocks__/documentData';
import { WORD_SUGGESTION_KEYS, INVALID_ID } from './shared/constants';
import { expectUniqSetsOfResponses, expectArrayIsInOrder } from './shared/utils';

const { expect } = chai;

describe('MongoDB Word Suggestions', () => {
  describe('/POST mongodb wordSuggestions', () => {
    it('should save submitted word suggestion', (done) => {
      suggestNewWord(wordSuggestionData)
        .end((_, res) => {
          expect(res.status).to.equal(200);
          expect(res.body.id).to.not.equal(undefined);
          done();
        });
    });

    it('should return a word error because of malformed data', (done) => {
      suggestNewWord(malformedWordSuggestionData)
        .end((_, res) => {
          expect(res.status).to.equal(400);
          expect(res.body.error).to.not.equal(undefined);
          done();
        });
    });

    it('should return a word error because invalid id', (done) => {
      const malformedData = { ...wordSuggestionData, originalWordId: 'ok123' };
      suggestNewWord(malformedData)
        .end((_, res) => {
          expect(res.status).to.equal(400);
          expect(res.body.error).to.not.equal(undefined);
          done();
        });
    });
  });

  describe('/PUT mongodb wordSuggestions', () => {
    it('should update specific wordSuggestion with provided data', (done) => {
      suggestNewWord(wordSuggestionData)
        .then((res) => {
          expect(res.status).to.equal(200);
          updateWordSuggestion(res.body.id, updatedWordSuggestionData)
            .end((_, result) => {
              expect(result.status).to.equal(200);
              forIn(updatedWordSuggestionData, (value, key) => {
                expect(isEqual(result.body[key], value)).to.equal(true);
              });
              done();
            });
        });
    });

    it('should return an example error because of malformed data', (done) => {
      suggestNewWord(wordSuggestionData)
        .then((res) => {
          expect(res.status).to.equal(200);
          updateWordSuggestion(res.body.id, malformedWordSuggestionData)
            .end((_, result) => {
              expect(result.status).to.equal(400);
              done();
            });
        });
    });

    it('should return an error because document doesn\'t exist', (done) => {
      getWordSuggestion(INVALID_ID)
        .end((_, res) => {
          expect(res.status).to.equal(400);
          expect(res.body.error).to.not.equal(undefined);
          done();
        });
    });
  });

  describe('/GET mongodb wordSuggestions', () => {
    it('should return a word suggestion by searching', (done) => {
      const keyword = wordSuggestionData.word;
      suggestNewWord(wordSuggestionData)
        .then(() => {
          getWordSuggestions({ keyword })
            .end((_, res) => {
              expect(res.status).to.equal(200);
              expect(res.body).to.be.an('array');
              expect(res.body).to.have.lengthOf.at.least(1);
              expect(res.body[0].word).to.equal(keyword);
              done();
            });
        });
    });

    it('should return a word suggestion by searching', (done) => {
      const filter = wordSuggestionData.word;
      suggestNewWord(wordSuggestionData)
        .then(() => {
          getWordSuggestions({ filter: { word: filter } })
            .end((_, res) => {
              expect(res.status).to.equal(200);
              expect(res.body).to.be.an('array');
              expect(res.body).to.have.lengthOf.at.least(1);
              expect(res.body[0].word).to.equal(filter);
              done();
            });
        });
    });

    it('should return all word suggestions', (done) => {
      Promise.all([suggestNewWord(wordSuggestionData), suggestNewWord(wordSuggestionData)])
        .then(() => {
          getWordSuggestions()
            .end((_, res) => {
              expect(res.status).to.equal(200);
              expect(res.body).to.have.lengthOf.at.least(5);
              forEach(res.body, (wordSuggestion) => {
                expect(wordSuggestion).to.have.all.keys(WORD_SUGGESTION_KEYS);
              });
              done();
            });
        });
    });

    it('should be sorted by number of approvals', (done) => {
      Promise.all([
        suggestNewWord(wordSuggestionData),
        suggestNewWord(wordSuggestionApprovedData),
      ]).then(() => {
        getWordSuggestions()
          .end((_, res) => {
            expect(res.status).to.equal(200);
            expectArrayIsInOrder(res.body, 'approvals', 'desc');
            done();
          });
      });
    });

    it('should return one word suggestion', (done) => {
      suggestNewWord(wordSuggestionData)
        .then((res) => {
          getWordSuggestion(res.body.id)
            .end((_, result) => {
              expect(result.status).to.equal(200);
              expect(result.body).to.be.an('object');
              expect(result.body).to.have.all.keys(WORD_SUGGESTION_KEYS);
              done();
            });
        });
    });

    it('should return at most twenty five word suggestions per request with range query', (done) => {
      Promise.all([
        getWordSuggestions({ range: true }),
        getWordSuggestions({ range: '[10,34]' }),
        getWordSuggestions({ range: '[35,59]' }),
      ]).then((res) => {
        expectUniqSetsOfResponses(res, 25);
        done();
      });
    });

    it('should return at most four word suggestions per request with range query', (done) => {
      getWordSuggestions({ range: '[5,8]' })
        .end((_, res) => {
          expect(res.status).to.equal(200);
          expect(res.body).to.have.lengthOf.at.most(4);
          done();
        });
    });

    it('should return at most ten word suggestions because of a large range', (done) => {
      getWordSuggestions({ range: '[10,40]' })
        .end((_, res) => {
          expect(res.status).to.equal(200);
          expect(res.body).to.have.lengthOf.at.most(10);
          done();
        });
    });

    it('should return at most ten word suggestions because of a tiny range', (done) => {
      getWordSuggestions({ range: '[10,9]' })
        .end((_, res) => {
          expect(res.status).to.equal(200);
          expect(res.body).to.have.lengthOf.at.most(10);
          done();
        });
    });

    it('should return at most ten word suggestions because of an invalid', (done) => {
      getWordSuggestions({ range: 'incorrect' })
        .end((_, res) => {
          expect(res.status).to.equal(200);
          expect(res.body).to.have.lengthOf.at.most(10);
          done();
        });
    });

    it('should return at most ten word suggestions per request with range query', (done) => {
      Promise.all([
        getWordSuggestions({ range: '[0,9]' }),
        getWordSuggestions({ range: '[10,19]' }),
        getWordSuggestions({ range: '[20,29]' }),
        getWordSuggestions({ range: [30, 39] }),
      ]).then((res) => {
        expectUniqSetsOfResponses(res);
        done();
      });
    });

    it('should return different sets of word suggestions for pagination', (done) => {
      Promise.all([
        getWordSuggestions(0),
        getWordSuggestions(1),
        getWordSuggestions(2),
      ]).then((res) => {
        expectUniqSetsOfResponses(res);
        done();
      });
    });

    it('should return prioritize range over page', (done) => {
      Promise.all([
        getWordSuggestions({ page: '1' }),
        getWordSuggestions({ page: '1', range: '[100,109]' }),
      ]).then((res) => {
        expect(isEqual(res[0].body, res[1].body)).to.equal(false);
        done();
      });
    });

    it('should return a descending sorted list of word suggestions with sort query', (done) => {
      const key = 'word';
      const direction = 'desc';
      getWordSuggestions({ sort: `["${key}": "${direction}"]` })
        .end((_, res) => {
          expect(res.status).to.equal(200);
          expectArrayIsInOrder(res.body, key, direction);
          done();
        });
    });

    it('should return an ascending sorted list of word suggestions with sort query', (done) => {
      const key = 'definitions';
      const direction = 'asc';
      getWordSuggestions({ sort: `["${key}": "${direction}"]` })
        .end((_, res) => {
          expect(res.status).to.equal(200);
          expectArrayIsInOrder(res.body, key, direction);
          done();
        });
    });

    it('should return ascending sorted list of word suggestions with malformed sort query', (done) => {
      const key = 'wordClass';
      getWordSuggestions({ sort: `["${key}]` })
        .end((_, res) => {
          expect(res.status).to.equal(200);
          expectArrayIsInOrder(res.body, key);
          done();
        });
    });
  });

  describe('/DELETE mongodb wordSuggestions', () => {
    it('should delete a single word suggestion', (done) => {
      suggestNewWord(wordSuggestionData)
        .then((res) => {
          expect(res.status).to.equal(200);
          deleteWordSuggestion(res.body.id)
            .then((result) => {
              expect(result.status).to.equal(200);
              expect(result.body.id).to.not.equal(undefined);
              getWordSuggestion(result.body.id)
                .end((_, resError) => {
                  expect(resError.status).to.equal(400);
                  expect(resError.body.error).to.not.equal(undefined);
                  done();
                });
            });
        });
    });

    it('should return an error for attempting to deleting a non-existing word suggestion', (done) => {
      deleteWordSuggestion(INVALID_ID)
        .then((deleteRes) => {
          expect(deleteRes.status).to.equal(400);
          done();
        });
    });

    it('should return error for non existent word suggestion', (done) => {
      getWordSuggestion(wordSuggestionId)
        .end((_, res) => {
          expect(res.status).to.equal(400);
          expect(res.body.error).to.not.equal(undefined);
          done();
        });
    });
  });
});