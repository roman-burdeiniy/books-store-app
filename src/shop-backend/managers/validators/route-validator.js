/**
 * Created by roman_b on 2/22/2017.
 */
import {matchRoute} from '../../frontendSource/src/utils/route-utils';
import { ACCEPTABLE_ROUTES_TEMPLATES, STATIC_ROUTES} from '../../frontendSource/src/constants/RoutesToActionsMap';
import _ from 'underscore';
import {CATEGORY_ID, SUB_CATEGORY_ID, ITEM_ID} from '../../frontendSource/src/constants/PathKeys';

export const validateRoute = (path, store) => {
                                let result = compose(validateSyntax, validateSemantics);
                                return result(path, store.getState());
                            }

function getValid(path){
    return condition({true : path, false: '/'});
}

function validateSyntax(inputPath){
    let result = ACCEPTABLE_ROUTES_TEMPLATES.reduce((previousValue, currentValue)=>{
        let res = new RegExp(currentValue).test(inputPath);
        return res || previousValue;
    }, false);
    let res = getValid(inputPath)(result);
    return res;
}

function validateSemantics(path, store){
    let res = condition({true: () => path, false : () => {
        let routeInfo = matchRoute(path);
        let checkExist = curried(routeInfo, store);
        let validationResult = isStaticPath(path) ||
            checkExist(isItemPath) ||
            checkExist(isSubCatPath) ||
            checkExist(isCatPath);
        let result = getValid(path)(validationResult);
        return result;
    }})
    return res(path == '/' || !store.dataModel.isInitialized)();
}

function compose(f, g) {
    return function(path, store) {
        return g(f(path), store);
    }
}

function curried(routeInfo, store) {
    return function(fun) {
        let catCheck = parameterCheckFabric(store, routeInfo);
        return fun(catCheck);
    };
};

function isCatPath(catCheck){
    const isValidWithFilledStore = (store, routeInfo) => {
        let findCat = combineCatFind(getCategories, findItem, store.dataModel);
        let found = findCat(routeInfo[CATEGORY_ID]);
        return found != null && routeInfo[SUB_CATEGORY_ID] == null;
    }
    return catCheck(isValidWithFilledStore)
}

function isStaticPath(path){
    return STATIC_ROUTES.find(item => item == path) != null;
}

function isItemPath(catCheck){
    const isValidWithFilledStore = (store, routeInfo) => {
        return true;
    }
    return catCheck(isValidWithFilledStore)
}

function isSubCatPath(catCheck){
    const isValidWithFilledStore = (store, routeInfo) => {
        let findSubCat = combineSubCatFind(getSubCategories, findItem, store.dataModel);
        let found = findSubCat(routeInfo[CATEGORY_ID], routeInfo[SUB_CATEGORY_ID]);
        return found != null && routeInfo[ITEM_ID] == null;
    }

    return catCheck(isValidWithFilledStore);
}

function combineCatFind(f1, f2, item){
    return (id)=>{
        return f2(f1(item), id);
    }
}

function combineSubCatFind(f1, f2, item){
    let catFind = combineCatFind(getCategories, findItem, item);
    return (id, subId)=>{
        return f2(f1(catFind(id)), subId);
    }
}

function getCategories(dataModel){
    return dataModel.groups;
}

function getSubCategories(cat){
    return cat != null ? cat.children : null;
}

function findItem(items, id){
    return !_.isEmpty(items) && id != null ? items.find((item)=>item._id === id) : null;
}

function parameterCheckFabric(store, routeInfo){
    return (fun) => {
        return fun(store, routeInfo)
    }
}

function condition(obj){
    return function(val){
        return obj[val];
    }
}
